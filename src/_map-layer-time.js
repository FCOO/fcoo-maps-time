/****************************************************************************
maps-layer-time

wms-layer and Map-Layer with time-dimension
Adjustments and extentions to classes from socib/Leaflet.TimeDimension https://github.com/socib/Leaflet.TimeDimension

****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    //Create namespaces
    var ns        = window.fcoo = window.fcoo || {},
        nsMap     = ns.map = ns.map || {},
        nsTime    = nsMap.time = nsMap.time || {};


    /********************************************************************************
    Extend different classes in L.TimeDimension
    ********************************************************************************/

    /*********************************************************************
    Add and remove default event-handler
    **********************************************************************/
//    L.TimeDimension.Layer.prototype.onAdd = function(onAdd) {
    $.extend(L.TimeDimension.Layer.prototype, {
        onAdd: function(onAdd) {
            return function (/*map*/) {
                var result = onAdd.apply(this, arguments);

                this._timeDimension.on("timeloading", this.NYtimeloading, this);
                this._timeDimension.on("timeload",    this.NYtimeload,    this);

                return result;
            };
        } (L.TimeDimension.Layer.prototype.onAdd),

//HER    L.TimeDimension.Layer.prototype.onRemove = function(onRemove) {
        onRemove: function(onRemove) {
            return function () {
                this._timeDimension.off("timeloading", this.NYtimeloading, this);
                this._timeDimension.off("timeload",    this.NYtimeload,    this);

                return onRemove.apply(this, arguments);
            };
        } (L.TimeDimension.Layer.prototype.onRemove),


        NYtimeloading: function(/*e*/){
//HER            var _this = this;
//HERconsole.log('ON');
//HERsetTimeout(function(){
//HER            _this.mapLayer.workingOn(0);
//HER}, 100);
        },

        NYtimeload: function(/*e*/){
//HER            var _this = this;
//HERconsole.log('OFF');
//HERsetTimeout(function(){
//HER            _this.mapLayer.workingOff(0);
//HER}, 100);
        }
    });


    /********************************************************************************
    Force layer to use the avaiable times from the timeDimension of the map (if any)
    ********************************************************************************/
    L.TimeDimension.Layer.WMS.prototype.onAdd = function(onAdd) {
        return function (map) {
            if (map.timeDimension)
                this.setAvailableTimes( map.timeDimension.getAvailableTimes() );

            return onAdd.apply(this, arguments);
        };
    } (L.TimeDimension.Layer.WMS.prototype.onAdd);

/*

GET COLOR BAR
https://wms01.fcoo.dk/webmap/v2/data/ECMWF/DYSD/ECMWF_DYSD_MAPS_GLOBAL.nc.wms?request=GetColorbar&styles=horizontal,nolabel&cmap=AirTempGlobal_C_BWYR_16colors_1.0
*/

/*
From ifm-maps/src/fcoo-leaflet-tilelayer-wms.js

        getLayer: function (options) {
            var o = this.getLayerOptions(options),
                layer = new L.TileLayer.WMS.Pydap(o.dataset, o.wmsParams, o.legendParams, o.options);
            return layer;
        },
*/



    /********************************************************************************
    MapLayer_Time
    A MapLayer representing a layer (layer_wms_time) with time dimentions
    ********************************************************************************/
    function MapLayer_Time(options) {
        //Adjust options


        nsMap.MapLayer.call(this, options);

    }
    nsMap.MapLayer_Time = MapLayer_Time;

    MapLayer_Time.prototype = Object.create(nsMap.MapLayer.prototype);



    MapLayer_Time.prototype = $.extend({}, nsMap.MapLayer.prototype, {    //OR nsMap.MapLayer_ANOTHER.prototype, {

        /********************************************************************************
        createLayer - create and a L.timeDimension.layer.wms
        ********************************************************************************/
        createLayer: function(options){
            var result = L.timeDimension.layer.wms(
                    nsMap.layer_dynamic(options, undefined, options.url),
                    nsMap.tdLayerWmsOptions
                );
            result.mapLayer = this;
            return result;
        },


        //Extend METHOD
        METHOD: function (METHOD) {
            return function () {

                //New extended code
                //......extra code

                //Original function/method
                METHOD.apply(this, arguments);
            };
        } (nsMap.MapLayer.prototype.METHOD),


        //Overwrite METHOD2
        METHOD2: function(){

        },

    });







//HER    //createMapLayer = {MAPLAYER_ID: CREATE_MAPLAYER_AND_MENU_FUNCTION} See fcoo-maps/src/map-layer_00.js for description
//HER    nsMap.createMapLayer = nsMap.createMapLayer || {};


//HER    /***********************************************************
//HER    Add MapLayer_NAME to createMapLayer
//HER    ***********************************************************/
//HER    nsMap.createMapLayer[ID] = function(options, addMenu){
//HER
//HER        adjust default options with options info mapLayerOptions
//HER
//HER        var mapLayer = nsMap._addMapLayer(id, nsMap.MapLayer_NAME, mapLayerOptions )
//HER
//HER        addMenu( mapLayer.menuItemOptions() ); OR list of menu-items
//HER    };
//HER







    /********************************************************************************
    Extend the L.{CLASS}.{METHOD} to do something more
    ********************************************************************************/
/*
    L.{CLASS}.prototype.{METHOD} = function ({METHOD}) {
        return function () {
    //Original function/method
    {METHOD}.apply(this, arguments);

    //New extended code
    ......extra code

        }
    } (L.{CLASS}.prototype.{METHOD});
*/



//_onNewTimeLoading, isReady and _update



}(jQuery, L, this, document));
