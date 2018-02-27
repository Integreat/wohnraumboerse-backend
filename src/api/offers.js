import {Router} from 'express'
import {OfferResponse} from '../services/OfferService'

const STATUS_OK = 200
const STATUS_NOT_FOUND = 404
const STATUS_INVALID_REQUEST = 400
const STATUS_SERVER_ERROR = 500

const getConfirmUrl = (city, token) => `http://neuburg.wohnen.integreat-app.de/offer/${token}/confirm`
const getDeleteUrl = (city, token) => `http://neuburg.wohnen.integreat-app.de/offer/${token}/delete`

const emailRegExp = new RegExp('^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\\.[a-zA-Z0-9._-]+$')
const durationRegExp = new RegExp('^[0-9]+$')

export default ({offerService}) => {
  const router = new Router()

  router.get('/getAll', (req, res) => {
    res.json(offerService.getAllOffers())
  })

  router.get('/', (req, res) => {
    res.json(offerService
      .getActiveOffers(req.city)
      .map(offer => offer.formData))
  })

  router.put('/', (req, res) => {
    const {email, formData, duration} = req.body
    if (!emailRegExp.test(email)) {
      console.log(emailRegExp.exec(email))
      res.status(STATUS_INVALID_REQUEST)
      res.json('Not a valid email')
      return
    } else if (!durationRegExp.test(duration)) {
      res.status(STATUS_INVALID_REQUEST)
      res.json('Not a valid duration')
      return
    }
    // todo check formData

    const token = offerService.createOffer(req.city, email, formData, Number(duration))

    res.mailer.send('confirmationEmail', {
      to: email,
      subject: 'Bitte bestätigen Sie Ihr Wohnungsangebot',
      confirmUrl: getConfirmUrl(req.city, token)
    }, err => {
      if (err) {
        // handle error
        console.log(err)
        res.status(STATUS_SERVER_ERROR)
        res.send('There was an error sending the email')
        return
      }
      res.status(STATUS_OK)
      res.json(token)
    })
  })

  router.post('/:token([a-z0-9]{128})/confirm', (req, res) => {
    const {response, offer} = offerService.confirmOffer(req.params.token)
    switch (response) {
      case OfferResponse.CONFIRMED:
        res.mailer.send('deleteEmail', {
          to: offer.email,
          subject: 'Bestätigung Ihres Wohnungsangebotes',
          deleteUrl: getDeleteUrl(offer.city, req.params.token)
        }, err => {
          if (err) {
            // handle error
            console.log(err)
            res.status(STATUS_SERVER_ERROR)
            res.send('There was an error sending the email')
            return
          }
          res.status(STATUS_OK)
          res.json(req.params.token)
        })
        break
      case OfferResponse.INVALID:
        res.status(STATUS_INVALID_REQUEST)
        res.send('Offer not available')
        break
      case OfferResponse.NOT_FOUND:
        res.status(STATUS_NOT_FOUND)
        res.send('No such offer')
        break
      default:
        res.status(STATUS_SERVER_ERROR)
        res.end()
    }
  })

  router.delete('/:token([a-z0-9]{128})', (req, res) => {
    const response = offerService.delete(req.params.token)
    switch (response) {
      case OfferResponse.CONFIRMED:
        res.status(STATUS_OK)
        res.end()
        break
      case OfferResponse.INVALID:
        res.status(STATUS_INVALID_REQUEST)
        res.send('Offer not available')
        break
      case OfferResponse.NOT_FOUND:
        res.status(STATUS_NOT_FOUND)
        res.send('No such offer')
        break
      default:
        res.status(STATUS_SERVER_ERROR)
        res.end()
    }
  })

  return router
}
