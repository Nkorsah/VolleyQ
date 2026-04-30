import '@testing-library/jest-dom'

const mockTextSearch = vi.fn((_req, callback) => {
  callback([], 'OK')
})

global.google = {
  maps: {
    places: {
      PlacesService: function() {
        return { textSearch: mockTextSearch }
      },
      PlacesServiceStatus: {
        OK: 'OK',
      },
    },
  },
} as any