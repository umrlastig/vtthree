/* eslint-disable */
import proj4 from "proj4";
import * as itowns from 'itowns';

export async function scene() {

    //retrieve view html container element
    const viewerDiv = document.getElementById('viewerDiv');

    //defining projection coordinate unit
    proj4.defs(
        'EPSG:2154',
        '+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
    );

    //defining the views geographic extent, how far does it go
    const viewExtent = new itowns.Extent(
        'EPSG:2154',
        222955.5000, 224545.5000, 6750269.5000, 6752639.5000
    );

    //const view = new itowns.PlanarView(viewerDiv, viewExtent);

    //defining the cameras placement
    const placement = {
        coord: viewExtent.center(),
        tilt: 12,
        heading: 40,
        range: 3000,
    }

    //creating the planar view
    const view = new itowns.PlanarView(viewerDiv, viewExtent, {
        placement: placement,
    });

    //definin the source for the satellite color image  ortho-image
    const sourceOrtho = new itowns.WMSSource({
        url: "https://wxs.ign.fr/3ht7xcw6f7nciopo16etuqp2/geoportail/r/wms",
        name: "HR.ORTHOIMAGERY.ORTHOPHOTOS",
        format: 'image/png',
        crs: 'EPSG:2154',
        extent: viewExtent,
    });

    //defining the color layer, ortho-image
    const layerOrtho = new itowns.ColorLayer('Ortho', { source: sourceOrtho });
    // adding it to the view
    view.addLayer(layerOrtho);

    //defining the source of the ELevation model
    const sourceDEM = new itowns.WMSSource({
        url: "https://wxs.ign.fr/3ht7xcw6f7nciopo16etuqp2/geoportail/r/wms",
        name: "ELEVATION.ELEVATIONGRIDCOVERAGE.HIGHRES",
        format: "image/x-bil;bits=32",
        crs: 'EPSG:2154',
        extent: viewExtent,
    });

    //creating the elevation layer
    const layerDEM = new itowns.ElevationLayer('DEM', { source: sourceDEM });
    //adding it to the view
    view.addLayer(layerDEM);
}
