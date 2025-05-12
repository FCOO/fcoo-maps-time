/****************************************************************************
maps-layer-time

wms-layer and Map-Layer with time-dimension
Adjustments and extentions to classes from socib/Leaflet.TimeDimension https://github.com/socib/Leaflet.TimeDimension

****************************************************************************/
(function ($, L, window, document, undefined) {
    "use strict";

    //Create namespaces
    let ns        = window.fcoo = window.fcoo || {};
    let nsMap     = ns.map = ns.map || {};
    let nsTime    = nsMap.time = nsMap.time || {};


    /********************************************************************************
    *********************************************************************************
    Extend L.TimeDimension
    *********************************************************************************
    ********************************************************************************/
    $.extend(L.TimeDimension.prototype, {

        initialize: function(_initialize){
            return function(){
                let result = _initialize.apply(this, arguments);

                this.on('timeloading', this.timeLoading, this);
                this.on('timeload',    this.timeLoad,    this);

                return result;

            };
        }(L.TimeDimension.prototype.initialize),

        getMapLayerList: function(){
            let result = [];
            this._syncedLayers.forEach( layer => {
                result.push(layer.mapLayer);
            });
            return result;
        },

        eachMapLayer: function( method, arg = [] ){
            let callThis = typeof method == 'string';
            arg = Array.isArray(arg) ? arg : [arg];
            if (callThis)
                arg.unshift('', this);
            this.getMapLayerList().forEach( function( mapLayer ){
                if (callThis)
                    mapLayer[method].apply(mapLayer, arg);
                else {
                    arg[0] = mapLayer;
                    method.apply(mapLayer, arg);
                }
            });
            return this;
        },

        setCurrentTime: function(_setCurrentTime){
            return function(time){
                this._syncedLayers.forEach( layer => layer._hideOrShowMapLayer(time) );
                return _setCurrentTime.apply(this, arguments);
            };
        }(L.TimeDimension.prototype.setCurrentTime),


        setLoading: function(on){
            if (this._syncedLayers.length){
                let fcooMapIndex = this._syncedLayers[0].fcooMapIndex;
                let method = on ? 'workingOn' : 'workingOff';
                this.eachMapLayer( mapLayer => mapLayer[method](fcooMapIndex) );
            }
            return this;
        },

        timeLoading: function( e ){
            this.setLoading(true);
            this.eachMapLayer( function( mapLayer ){
                if (mapLayer.onTimeLoading)
                    mapLayer.onTimeLoading(e.time);
            });
            return true;
        },

        timeLoad: function( e ){
            this.eachMapLayer( function( mapLayer ){
                if (mapLayer.onTimeLoad)
                    mapLayer.onTimeLoad(e.time);
            });
            return true;
        },

        _getTimeList: function(range = {}){
            let min      = nsTime.timeOptions.min,
                max      = nsTime.timeOptions.max,
                mom      = moment(nsTime.nowMoment).add(min, nsTime.unit),
                timeList = [];

            range = $.extend({
                        min: Number.NEGATIVE_INFINITY,
                        max: Number.POSITIVE_INFINITY
                    }, range);

            for (var i=min; i<=max; i++){
                let nextTime = mom.toDate().getTime();
                if ((nextTime >= range.min) && (nextTime <= range.max))
                    timeList.push( nextTime );
                mom.add(1, nsTime.unit);
            }
            return timeList;
        },

        _updateNow: function(){
            //set the range of this.timeDimension based on current 'now' and global min and max relative range
            this.setAvailableTimes(this._getTimeList(), 'replace');

            //Force updating
            this.nowAsStr = nsTime.nowMoment.toString();

            this.eachMapLayer( this._updateMapLayerTimeRange.bind(this) );
        },


        _updateMapLayerTimeRange: function(mapLayer){
            if (!this.nowAsStr || !mapLayer.lastNowStr || (mapLayer.lastNowStr != this.nowAsStr)){
                if (mapLayer.setTimeRange)
                    mapLayer.setTimeRange();
                else
                    mapLayer.timeRange = {
                        min: Number.NEGATIVE_INFINITY,
                        max: Number.POSITIVE_INFINITY
                    };
                mapLayer.lastNowStr = this.nowAsStr;
            }
        }
    });

    /*********************************************************************
    **********************************************************************
    Extend L.TimeDimension.Layer
    ***********************************************************************
    **********************************************************************/
    $.extend(L.TimeDimension.Layer.prototype, {

        //Overwrite onAdd to use the avaiable times from the timeDimension of the map (if any)
        onAdd: function(onAdd) {
            return function (map) {
                let result = onAdd.apply(this, arguments);

                if (map.timeDimension){
                    this.setAvailableTimes( map.timeDimension.getAvailableTimes() );
                    this._hideOrShowMapLayer(map.timeDimension.getCurrentTime());
                }

                this._timeDimension.on("timeload", this.timeLoad, this);

                return result;
            };
        } (L.TimeDimension.Layer.prototype.onAdd),


        onRemove: function(onRemove) {
            return function () {
                this._timeDimension.off("timeload", this.timeLoad, this);
                return onRemove.apply(this, arguments);
            };
        } (L.TimeDimension.Layer.prototype.onRemove),

        timeLoad: function(/*e*/){
            this.mapLayer.workingOff(this.fcooMapIndex);

        },

        _isInTimeRange: function(time){
            this._timeDimension._updateMapLayerTimeRange(this.mapLayer);
            let timeRange = this.mapLayer.timeRange || {min: Number.NEGATIVE_INFINITY, max: Number.POSITIVE_INFINITY};
            return (time >= timeRange.min) && (time <= timeRange.max);
        },


        _hideOrShowMapLayer: function(time){
            this.mapLayer.toggleVisibility(this.fcooMapIndex, this._isInTimeRange(time));
        },

        /*********************************************************************
        _setTimeRange: Set the time-range (setAvailableTimes) based on
        the time-range from this.mapLayer
        **********************************************************************/
        _setTimeRange: function(){
            if (!this.nowAsStr || (this._timeDimension.nowAsStr != this.nowAsStr)){
                if (this.mapLayer.setTimeRange)
                    this.mapLayer.setTimeRange();
                else
                    this.mapLayer.timeRange = {
                        min: Number.NEGATIVE_INFINITY,
                        max: Number.POSITIVE_INFINITY
                    };

                this.nowAsStr = this._timeDimension.nowAsStr;
                this.setAvailableTimes( this._timeDimension._getTimeList(this.mapLayer.timeRange) );
            }
        }
    });


    /*********************************************************************
    Extend L.TimeDimension.Layer.WMS
    **********************************************************************/
    $.extend(L.TimeDimension.Layer.WMS.prototype, {
        //Overwrite _showLayer to hide the layer if the layer isn't in time-range. Prevents unnecessary load of tiles
        _showLayer: function(_showLayer) {
            return function(layer, time){
                if (this._isInTimeRange(time))
                    _showLayer.apply(this, arguments);
                else {
                    if (this._currentLayer)
                        this._currentLayer.hide();
                    if (this._baseLayer)
                        this._baseLayer.hide();
                }
            };
        }(L.TimeDimension.Layer.WMS.prototype._showLayer),

        //Overwrite _getLayerForTime to return baseLayer if the layer isn't in time-range
        _getLayerForTime: function(_getLayerForTime) {
            return function (time) {
                return this._isInTimeRange(time) ? _getLayerForTime.apply(this, arguments) : this._baseLayer;
            };
        } (L.TimeDimension.Layer.WMS.prototype._getLayerForTime),
    });


    /********************************************************************************
    *********************************************************************************
    Extend nsMap.MapLayer
    *********************************************************************************
    ********************************************************************************/
    $.extend( nsMap.MapLayer.prototype, {

    });

    /********************************************************************************
    *********************************************************************************
    MapLayer_time
    A MapLayer representing a layer with time dimentions
    *********************************************************************************
    ********************************************************************************/
    function MapLayer_time(options) {
        nsMap.MapLayer.call(this, options);
        this.tdLayerConstructor = this.tdLayerConstructor || options.tdLayerConstructor || L.TimeDimension.Layer;
    }

    nsMap.MapLayer_time = MapLayer_time;

    MapLayer_time.prototype = Object.create(nsMap.MapLayer.prototype);
    $.extend(MapLayer_time.prototype, {

        //Overwrite _createLayer to use this.tdLayerConstructor as a 'outer' constructor
        _createLayer: function(_createLayer) {
            return function () {
                let layer = _createLayer.apply(this, arguments);
                return this.tdLayerConstructor(layer, nsMap.tdLayerWmsOptions);
            };
        } (nsMap.MapLayer.prototype._createLayer),



        /*
        setTimeRange: Sets the time-range for the layer.
        options.timeRange.min/max can be a
            1: NUMBER = Relative to now
            2: DATE
            3: MOMENT
            4: STRING = Date-string
            5: function() return 1,2,3, or 4
        */
        setTimeRange: function(timeRange){
            this.timeRange = {
                min: Number.NEGATIVE_INFINITY,
                max: Number.POSITIVE_INFINITY
            };
            this.options.timeRange = timeRange || this.options.timeRange || {};
            ['min', 'max'].forEach( function(id){
                if (this.options.timeRange[id] !== undefined){
                    let range = this.options.timeRange[id];
                    let rangeMoment = typeof range == 'number' ? moment(nsTime.nowMoment).add(range, nsTime.unit) : moment(range);

                    this.timeRange[id] = rangeMoment.valueOf();
                }
            }.bind(this));
        },


        //onTimeLoading = called from timeDimension when a new time-step is starting to load. Can be overwriten by child-classes
        onTimeLoading: function(/* time */){
        },

        //onTimeLoad = called from timeDimension when a new time-step is loaded. Can be overwriten by child-classes
        onTimeLoad: function(/* time */){
        }
    });



    /********************************************************************************
    MapLayer_time_geojson
    A MapLayer representing a geojson-layer with time dimentions
    See fcoo-maps for description on options
    ********************************************************************************/
    function MapLayer_time_geojson(options) {
        nsMap.MapLayer_time.call(this, options);
    }

    nsMap.MapLayer_time_geojson = MapLayer_time_geojson;

    MapLayer_time_geojson.prototype = Object.create(nsMap.MapLayer_time.prototype);

    MapLayer_time_geojson.prototype.createLayer        = L.geoJSON; //@todo mangler - Skal nok være noget andet
    MapLayer_time_geojson.prototype.tdLayerConstructor = L.TimeDimension.Layer.GeoJSON;


    /********************************************************************************
    MapLayer_time_wms
    A MapLayer representing any wms-layer with time dimentions
    See fcoo-maps for description on options
    ********************************************************************************/
    function MapLayer_time_wms(options) {
        nsMap.MapLayer_time.call(this, options);
    }

    nsMap.MapLayer_time_wms = MapLayer_time_wms;

    MapLayer_time_wms.prototype = Object.create(nsMap.MapLayer_time.prototype);

    MapLayer_time_wms.prototype.createLayer        = nsMap.layer_wms;
    MapLayer_time_wms.prototype.tdLayerConstructor = L.timeDimension.layer.wms;


    /********************************************************************************
    MapLayer_time_wms_static
    A MapLayer representing a static wms-layer with time dimentions (self-contradictory?)
    See fcoo-maps for description on options
    ********************************************************************************/
    function MapLayer_time_wms_static(options) {
        nsMap.MapLayer_time_wms.call(this, options);
    }

    nsMap.MapLayer_time_wms_static = MapLayer_time_wms_static;

    MapLayer_time_wms_static.prototype = Object.create(nsMap.MapLayer_time_wms.prototype);

    MapLayer_time_wms_static.prototype.createLayer = nsMap.layer_wms_static;
    //MapLayer_time_wms.prototype.tdLayerConstructor = L.timeDimension.layer.wms;


    /********************************************************************************
    MapLayer_time_wms_dynamic
    A MapLayer representing a dynamic wms layer with time dimentions
    See fcoo-maps for description on options
    ********************************************************************************/
    function MapLayer_time_wms_dynamic(options) {
        nsMap.MapLayer_time_wms.call(this, options);
    }

    nsMap.MapLayer_time_wms_dynamic = MapLayer_time_wms_dynamic;

    MapLayer_time_wms_dynamic.prototype = Object.create(nsMap.MapLayer_time_wms.prototype);

    MapLayer_time_wms_dynamic.prototype.createLayer = nsMap.layer_wms_dynamic;
    //MapLayer_time_wms_dynamic.prototype.tdLayerConstructor = L.timeDimension.layer.wms;


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

}(jQuery, L, this, document));
