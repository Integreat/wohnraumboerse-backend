import {Router} from 'express'
import {body, param, validationResult} from 'express-validator/check'
import {matchedData} from 'express-validator/filter'
import {TOKEN_LENGTH} from '../utils/createToken'
import HttpStatus from 'http-status-codes'
import hash from '../utils/hash'

const validateMiddleware = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({errors: errors.mapped()})
  } else {
    next()
  }
}

export default ({offerService}) => {
  const router = new Router()

  router.get('/getAll', (req, res) => {
    // There are basically 2 ways of executing a query, with or without callback.
    offerService.getAllOffersQuery().exec((err, queryResult) => {
      if (err) {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(err)
      } else {
        return res.json(queryResult)
      }
    })
  })

  router.get('/', (req, res) => {
    offerService
      .getActiveOffersQuery(req.city)
      .exec((err, queryResult) => {
        if (err) {
          return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(err)
        } else {
          return res.json(queryResult)
        }
      })
  })

  router.put('/', [
    body('email').isEmail().trim().normalizeEmail(),
    body('duration').isInt().toInt().custom(value => [3, 7, 14, 30].includes(value)),
    body('formData').exists(),
    validateMiddleware,
    async (req, res) => {
      const {email, formData, duration} = matchedData(req)
      try {
        const token = await offerService.createOffer(req.city, email, formData, duration)
        return res.status(HttpStatus.CREATED).json(token)
      } catch (e) {
        console.error(e)
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(e)
      }
    }
  ])

  router.post(`/:token/confirm`, [
    param('token').isHexadecimal().isLength(TOKEN_LENGTH),
    validateMiddleware,
    async (req, res) => {
      try {
        const {token} = matchedData(req)
        const offer = await offerService.getOfferByTokenQuery(token).exec()

        if (!offer) {
          return res.status(HttpStatus.NOT_FOUND).json('No such offer')
        } else if (offer.isExpired() || offer.deleted) {
          return res.status(HttpStatus.GONE).json('Offer not available')
        }

        await offerService.confirmOffer(offer, token)
        return res.status(HttpStatus.OK).end()
      } catch (e) {
        console.error(e)
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(e)
      }
    }
  ])

  router.post(`/:token/extend`, [
    param('token').isHexadecimal().isLength(TOKEN_LENGTH),
    body('duration').isInt().toInt().custom(value => [3, 7, 14, 30].includes(value)),
    validateMiddleware,
    async (req, res) => {
      try {
        const {token, duration} = matchedData(req)
        const offer = await offerService.getOfferByTokenQuery(token).exec()

        if (!offer) {
          return res.status(HttpStatus.NOT_FOUND).json('No such offer')
        } else if (offer.deleted || !offer.confirmed) {
          return res.status(HttpStatus.BAD_REQUEST).json('Offer not available')
        }

        await offerService.extendOffer(token, duration)
      } catch (e) {
        console.error(e)
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(e)
      }
    }
  ])

  router.delete(`/:token`, [
    param('token').isHexadecimal().isLength(TOKEN_LENGTH),
    validateMiddleware,
    async (req, res) => {
      try {
        const {token} = matchedData(req)
        const offer = await offerService.getOfferByTokenQuery(token).exec()

        if (!offer) {
          return res.status(HttpStatus.NOT_FOUND).json('No such offer')
        } else if (offer.deleted) {
          return res.status(HttpStatus.BAD_REQUEST).json('Already deleted')
        }

        await offerService.deleteOffer(offer)
        return res.status(HttpStatus.OK).end()
      } catch (e) {
        console.error(e)
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(e)
      }
    }
  ])

  return router
}
