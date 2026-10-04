const { successResponse } = require('../utils/response');

/**
 * Return available NASA GIBS imagery layers.
 * The frontend uses these to texture the globe.
 */
exports.getImageryLayers = (req, res) => {
  const layers = [
    {
      id: 'MODIS_Terra_CorrectedReflectance_TrueColor',
      name: 'NASA Blue Marble (MODIS Terra)',
      format: 'jpeg',
      tileMatrixSet: 'GoogleMapsCompatible_Level9',
      resolution: '250m'
    },
    {
      id: 'VIIRS_SNPP_CorrectedReflectance_TrueColor',
      name: 'NASA VIIRS SNPP',
      format: 'jpeg',
      tileMatrixSet: 'GoogleMapsCompatible_Level9',
      resolution: '250m'
    }
  ];
  
  res.json(successResponse(layers));
};
