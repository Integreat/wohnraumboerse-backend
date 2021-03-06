// @flow

import CityConfig from './CityConfig'

export default {
  neuburgschrobenhausenwohnraum: new CityConfig({
    cmsName: 'neuburgschrobenhausenwohnraum',
    hostname: 'raumfrei.neuburg-schrobenhausen.de',
    formsEnabled: true,
    title: 'Raumfrei Neuburg-Schrobenhausen',
    logo: `{}/v0/city-configs/image/neuburg_logo.svg`,
    favicon: `{}/v0/city-configs/image/neuburg_favicon.ico`
  }),
  testumgebungwohnraum: new CityConfig({
    cmsName: 'testumgebungwohnraum',
    hostname: 'test.wohnen.integreat-app.de',
    formsEnabled: true,
    title: 'Testumgebung',
    logo: '{}/v0/city-configs/image/testumgebung_logo.png',
    favicon: '{}/v0/city-configs/image/testumgebung_favicon.ico'
  }),
  bayreuthwohnraum: new CityConfig({
    cmsName: 'bayreuthwohnraum',
    hostname: 'wohnraumboerse.bayreuth.de',
    formsEnabled: false,
    title: 'Bayreuth',
    logo: `{}/v0/city-configs/image/bayreuth_logo.png`,
    favicon: `{}/v0/city-configs/image/bayreuth_favicon.ico`
  }),
  lkheidenheimwohnraum: new CityConfig({
    cmsName: 'lkheidenheimwohnraum',
    hostname: 'wohnraumboerse.landkreis-heidenheim.de', // todo: Replace with real domain name once delivered
    formsEnabled: true,
    title: 'Wohnraumbörse Landkreis Heidenheim',
    logo: `{}/v0/city-configs/image/heidenheim_logo.png`,
    favicon: `{}/v0/city-configs/image/heidenheim_favicon.ico`
  })
}
