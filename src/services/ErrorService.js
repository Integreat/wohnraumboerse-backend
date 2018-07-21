// @flow

import ErrorResponse from '../models/ErrorResponse'
import _ from 'lodash'
import log4js from 'log4js'

const develop = process.env.NODE_ENV === 'development'

const errorTypes = {
  token: 'token',
  confirmation: 'confirmation',
  validation: 'validation',
  server: 'server'
}

export default class ErrorService {
  constructor () {
    this.logger = log4js.getLogger()
  }

  createInternalServerErrorResponse (error: Error): Error | ErrorResponse {
    this.logger.error(error)
    if (develop) {
      return error.message
    } else {
      return new ErrorResponse(errorTypes.server,
        'Ein interner Serverfehler ist aufgetreten. Bitte kontaktieren Sie Ihren Administrator.')
    }
  }

  createOfferNotFoundErrorResponse (token: string): ErrorResponse {
    return new ErrorResponse(errorTypes.token, `Das Angebot mit Token '${token}' existiert nicht oder wurde gelöscht.`)
  }

  createOfferNotConfirmedErrorResponse (): ErrorResponse {
    return new ErrorResponse(errorTypes.confirmation, 'Das Angebot wurde noch nicht bestätigt. Bitte bestätigen Sie Ihr Angebot zuerst.')
  }

  createOfferExpiredErrorResponse (token: string): ErrorResponse {
    return new ErrorResponse(errorTypes.token, `Das Angebot mit Token '${token}' ist bereits abgelaufen.`)
  }

  createConfirmationLinkExpiredErrorResponse (token: string): ErrorResponse {
    return new ErrorResponse(errorTypes.token, `Der Bestätigungslink des Angebots mit Token '${token}' ist abgelaufen.`)
  }

  createValidationFailedErrorResponse (error: ValidationError): ErrorResponse {
    const fieldErrorMessages = Object.values(error.errors).map((e: mixed): string => e.message)
    return new ErrorResponse(errorTypes.validation, `Im Formular sind die folgenden Fehler aufgetreten: ${fieldErrorMessages.join(' ')}`)
  }

  createValidationFailedErrorResponseFromArray (errors: Array<Error>): ErrorResponse {
    const errorFields = errors.array().map((error: Error): string => this.translateOuterFormPaths(error.param))
    const errorFieldsWithoutDuplicates = _.uniq(errorFields)
    const message = `Ungültige oder fehlende Eingaben in dem/den folgenden Feld(ern): ${errorFieldsWithoutDuplicates.join(', ')}`
    return new ErrorResponse(errorTypes.validation, message)
  }

  translateOuterFormPaths (param: string): string {
    switch (param) {
      case 'email':
        return 'E-Mail'
      case 'duration':
        return 'Dauer des Angebots'
      case 'agreedToDataProtection':
        return 'Zustimmung zu den Datenschutzbestimmungen'
      case 'formData':
        return 'Formular'
      case 'token':
        return 'Token'
    }
  }
}
