import { VTThreeViewer, RENDER_MODE } from "./VTThreeViewer";
import * as THREE from "three";
import { OLViewer, IGN_STYLES } from "./OLViewer";
import Feature from "ol/Feature";
import { ZOOM_RES_L93 } from "./Utils";
import { Euler, Vector3 } from "three";
import { distance } from "@turf/turf";
import * as dat from 'dat.gui';


export class VTController {
  constructor(
    width,
    height,
    center,
    zoom,
    layers,
    renderMode,
    style,
    tileZoom,
    paramsGUI
  ) {
    this.width = width;
    this.height = height;
    this.renderMode = renderMode;
    this.features = new Map();
    this.layers = layers;
    this.zoomOlViewer = this.zoomOlViewer.bind(this);
    this.loadTileFeatures = this.loadTileFeatures.bind(this);
    this.render = this.render.bind(this);
    this.init(center, zoom, renderMode, style, tileZoom);
    this.state = { loading: 0 };
    this.tileZoom = tileZoom;
    this.flowLine = paramsGUI.flowLine;
    this.baseSpeed = paramsGUI.speedFlux;
    this.opaciteMax = paramsGUI.opaciteMax;
    this.opaciteMin = paramsGUI.opaciteMin;
    this.reposFlux = paramsGUI.newPosFlux;
    this.typeFourchette = paramsGUI.typeFourchette;
  }

  async init(center, zoom, renderMode, style, tileZoom) {
    this.threeViewer = new VTThreeViewer(
      this.width,
      this.height,
      "white",
      !tileZoom,
      center,
      ZOOM_RES_L93[zoom]
    );
    this.olViewer = await new OLViewer(
      this.width,
      this.height,
      center,
      zoom,
      style
    );
    let self = this;
    this.olViewer.map.on("rendercomplete", function() {
      console.log("map render complete!");
      var mapContainer = document.getElementById("map");
      var mapCanvas = mapContainer.getElementsByTagName("canvas")[0];
      self.threeViewer.setPlaneTexture(mapCanvas);
    });

    
    this.olViewer.layer.getSource().on("tileloadstart", function(evt) {
      self.state.loading++;
    });

    this.olViewer.layer.getSource().on("tileloadend", this.loadTileFeatures);

    if (this.tileZoom) {
      this.threeViewer.renderer.domElement.addEventListener("wheel", event => {
        //console.log("wheeeel ");
        self.zoomOlViewer(event);
      });
    }

    this.render();
  }

  render() {
    if (this.tileZoom && this.state.loading != 0) {
      console.log("render ol!");
      var mapContainer = document.getElementById("map");
      var mapCanvas = mapContainer.getElementsByTagName("canvas")[0];
      this.threeViewer.setPlaneTexture(mapCanvas);
    }

    //PLACING & ANIMATING FLOWS
    this.threeViewer.scene.traverse (function (flow){
      if (flow.name == "flow" || flow.name == "skyFlow"){

        var scale = flow.size

        //RESETING POSITION IF NECESSARY
        var coef = 1;
        
        var currentDistanceFromInit = Math.sqrt((flow.initPosX - flow.position.x)**2 + (flow.initPosY - flow.position.y)**2 + (flow.currentZ - flow.position.z)**2);
        if (currentDistanceFromInit >= coef*scale){

          //les ajouts aléatoires sont très importants et jouent bcp sur le rendu (à supprime si mieux quand très fluide).
          //ils apportent un léger décalagage spatial pour donner plus de naturel, et du coup un décalage temporel (car la distance
          // à l'origine n'est plus toujours la même, ce qui évite l'effet "hypnotisant", "déjà vu", "répétitif")
          // mais cela brouille un peu aussi la donnée, c'est légèrement moins clair

          if (this.typeFourchette == 0){
            var refPosZ = flow.initPosZ;
          }
          else if (this.typeFourchette > 0){
            var refPosZ = flow.currentZ;
          }

          if (this.reposFlux == "Fixe"){
            flow.position.x = flow.initPosX;
            flow.position.y = flow.initPosY;
          }
          else if (this.reposFlux == "Aléatoire"){
            flow.position.x = flow.initPosX + scale*Math.random()/2; 
            flow.position.y = flow.initPosY + scale*Math.random()/2;
          }
          flow.position.z = refPosZ;
          currentDistanceFromInit = 0;
        }

        
        //MOVEMENT HANDLING

        //console.log(this.baseSpeed);
        var deltaX = flow.speedX*this.baseSpeed;
        var deltaY = flow.speedY*this.baseSpeed;
        var deltaZ = flow.speedZ*this.baseSpeed;

        flow.position.x += deltaX;
        flow.position.y += deltaY;
        flow.position.z += deltaZ;

        //OPACITY HANDLING (OPACITY = FUNCTION OF POSITION... STRANGELY ENOUGH)
        
        if (currentDistanceFromInit < coef*scale/2){ //phase ascendante d'opacité
          flow.children[0].material.opacity = this.opaciteMax + (currentDistanceFromInit - coef*scale/2)/(coef*scale/2) + this.opaciteMin;

        }
        else{ //phase descendante d'opacité
          flow.children[0].material.opacity = this.opaciteMax - (currentDistanceFromInit - coef*scale/2)/(coef*scale/2) + this.opaciteMin;
        }
      }
    }.bind(this));

    if (this.flowLine){
      this.flowLine.moveAlongCurve(0.01);
    }




    this.threeViewer.animate();
    requestAnimationFrame(function() {
      this.render();
    }.bind(this)); 
  }

  loadVTile() {
    return new Promise(function(resolve, reject) {
      this.olViewer.layer.getSource().on("tileloadend", resolve);
    });
  }

  zoomOlViewer(event) {
    console.log("zoooooom!");
    //var zoom = controls.target.distanceTo( controls.object.position )
    //console.log(this.threeViewer.controls.target.distanceTo(this.threeViewer.controls.object.position));
    //this.olViewer.domElement.dispatchEvent(
    this.olViewer.map.getViewport().dispatchEvent(
      new WheelEvent("wheel", {
        // deltaX: event.deltaX,
        // deltaY: event.deltaY,
        // clientX: this.width / 4,
        // clientY: this.height / 4
        clientX: event.clientX,
        clientY: event.clientY,
        screenX: event.screenX,
        screenY: event.screenY
      })
    );
    event.preventDefault();
  }

  loadTileFeatures(evt) {
    console.log("tile load end!");
    var z = evt.tile.getTileCoord()[0];
    var features = evt.tile.getFeatures();
    let layer = "";
    let self = this;
    let tileFeatures = new Map();
    for (let feature of features) {
      for (let layerName of self.layers) {
        if (feature.getProperties().layer == layerName) {
          layer = feature.getProperties().layer;
          if (!self.features.has(layer)) {
            self.features.set(layer, new Map());
          }
          if (!tileFeatures.has(layer)) {
            tileFeatures.set(layer, []);
          }
          if (!self.features.get(layer).has(feature.ol_uid)) {
            self.features.get(layer).set(feature.ol_uid, feature);
            tileFeatures.get(layer).push(feature);
          }
        }
      }
    }
    tileFeatures.forEach((value, key) => {
      self.threeViewer.addFeatures(
        value,
        self.olViewer.map.getView().getCenter(),
        ZOOM_RES_L93[self.olViewer.map.getView().getZoom()],
        key,
        self.renderMode
      );
    });

    self.state.loading--;
    if (self.state.loading == 0) {
      this.olViewer.layer.getSource().on("tileloadend", evt => {
        self.state.loading--;
      });
    }
  }
}
