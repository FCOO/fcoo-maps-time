/***********************************************************************************
bottom-menu-ElementSet.js

*************************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    //Create namespaces
    var ns        = window.fcoo = window.fcoo || {},
        nsMap     = ns.map = ns.map || {},
        nsTime    = nsMap.time = nsMap.time || {};


    /**************************************************************************
    elementSetList = []ElementSet
    ElementSet = {
        options: {
            $container   : $-element
            elementList  : ELEMENTLIST = [] of STRING or OPTIONS or ELEMENTLIST or {ownContainer:true, class:STRING} ownContainer:true => create new inner div with class
            defaultGroups: {BOTTOM-MENU-SIZE or "ALL"} of STRING = space seperated group-ids
            prioList     : {BOTTOM-MENU-SIZE or "ALL"} of {MODE}[]STRING or []STRING. []STRING = space seperated group-ids
        }
    }
    The elements in $container are all part of groups.
    Depending of the current width of $container not all elements are visible
    prioList contains a list of strings with group-ids.
    The function bottomMenu_onResize will find the set of groups in prioList tha fits the current
    width of $container and shown/hide the elements

    **************************************************************************/
    function ElementSet( options ){
        this.options    = options;
        this.$container = options.$container;

        this.groupWidth    = {}; //{GROUPID}WIDTH
        this.callWidth     = true;

        this.addElementList( options.elementList );
    }

    ElementSet.prototype = {
        //get: Return the bms, mode, ori version from data
        get: function(data, bms, mode, ori, defaultValue){
            if (data === undefined)
                return defaultValue;

            if (Array.isArray(data) || (typeof data == 'string'))
                return data;

            return this.get( data[bms] || data['ALL'], mode, ori, null, defaultValue);
        },

        getString: function(data, bms, mode, ori){
            return this.get(data, bms, mode, ori, '');
        },

        getArray: function(data, bms, mode, ori){
            return this.get(data, bms, mode, ori, []);
        },

        addElementList: function(list){
            var _this = this,
                $newElem;

            $.each( list, function(index, element ){
                if (!element)
                    return;

                if (Array.isArray(element)){
                    _this.addElementList( element );
                    return;
                }

                if (element instanceof $){
                    _this.$container.append(element);
                    return;
                }

                $newElem = null;

                var options = typeof element == 'string' ? {id: element} : element,
                    elementId = options.id;

                //First element or options.ownContainer => create sub-div
                if (!_this.$currentDiv || options.ownContainer)
                    _this.$currentDiv = $('<div/>')
                        .toggleClass('w-100', !!options.fullWidth)
                        .addClass(options.class || options.className || '')
                        .appendTo(_this.$container);

                var elem        = nsTime.elements[elementId],
                    $elem       = $.isPlainObject( elem ) ? nsTime.elements[elem.id] : elem,
                    elemOptions = $.isPlainObject( elem ) ? elem : {};

                if ($.isFunction(elemOptions.content))
                    $newElem = elemOptions.content( _this.$currentDiv, this, elemOptions);
                else
                    $newElem = $elem ? $elem.clone(true) : null;

                if (!$newElem)
                    return;

                //Adjust newElement
                $newElem.addClass(elemOptions.class || elemOptions.className || '');
                $newElem.css(elemOptions.css || {});

                if (elemOptions.width)
                    $newElem.width(elemOptions.width);

                if (elemOptions.align)
                    $newElem
                        .removeClass('text-center')
                        .addClass('text-'+elemOptions.align);

                if (elemOptions.on){
                    $newElem.removeClass('disabled show-as-normal transparent');
                    $.each(elemOptions.on, function(event, func){
                        $newElem.on(event, func);
                    });
                }

                //If it is a button with slider features create it
                if (elemOptions.slider)
                    nsTime.createSliderButton(elemOptions.slider, $newElem);



                var groupId = (nsTime.elementGroup[elementId] || elementId) + (elemOptions.subVersion ? '-'+elemOptions.subVersion : '');
                $newElem.addClass('group-'+groupId);
                _this.groupWidth[groupId] = 0;

                $newElem.appendTo( _this.$currentDiv );
            });

            return this.$container;
        },

        //**************************************************************************
        update: function(){
            //******************************************
            function splitStr(str){ return str.split(' ').filter(function(elem){ return !!elem; }); }
            //******************************************
            function compress( record ){
                var commonContentAsStr = null,
                    returnAsAll = true;

                $.each(record, function(id, content){
                    var contentAsStr = JSON.stringify(content);
                    if (commonContentAsStr === null)
                        commonContentAsStr = contentAsStr;
                    else
                        if (commonContentAsStr != contentAsStr)
                            returnAsAll = false;
                });
                return returnAsAll ? {ALL: JSON.parse(commonContentAsStr)} : record;
            }
            //******************************************
            if (!this.options.prioList)
                 return;

            var _this        = this,
                $allElements = this.$container.children('div').children();

            if (this.callWidth){
                this.callWidth = false;
                $.each(this.groupWidth, function(id){
                    $allElements.filter('.group-'+id).each( function(index, elem){
                        _this.groupWidth[id] = _this.groupWidth[id] + ($(elem).outerWidth(true) || 0);
                    });
                });

                //Find the total width of all groups in each set of bms, mode, orientation
                var newPrio = {};

                nsTime.bottomMenuSizes.forEach( function( bms ){
                    newPrio[bms] = {};
                    nsTime.timeOptions.timeModeList.forEach( function( mode ){
                        newPrio[bms][mode] = {};
                        ['portrait', 'landscape'].forEach( function( ori ){
                            var prioAndWidthList = newPrio[bms][mode][ori] = [],
                                defaultGroups    = _this.getString( _this.options.defaultGroups || '', bms, mode, ori ),
                                prioList         = _this.getArray( _this.options.prioList, bms, mode, ori );

                            prioList.forEach( function( prioStr ){
                                var groupList = splitStr(defaultGroups).concat( splitStr(prioStr) ),
                                    groupWidth = 0;
                                groupList.forEach( function( groupId ){
                                    groupWidth = groupWidth + (_this.groupWidth[groupId] || 0);
                                });
                                prioAndWidthList.push({
                                    list : groupList,
                                    width: groupWidth
                                });
                            });
                        });
                        newPrio[bms][mode] = compress( newPrio[bms][mode] );
                    });
                    newPrio[bms] = compress( newPrio[bms] );
                });
                this.options.prioList = compress( newPrio );
            }

            //Find the set of groups with largest width less that container width
            var bms              = ns.appSetting.get('bottomMenuSize'),
                mode             = nsTime.timeMode,
                orientation      = $('html').hasClass('landscape') ? 'landscape' : 'portrait',
                prioList         = this.getArray( this.options.prioList, bms, mode, orientation ),
                currentGroupList = prioList.length ? prioList[0].list : [],
                containerWidth   = this.$container.width();

            if (prioList)
                prioList.forEach( function( listAndWidth ){
                    if (listAndWidth.width <= containerWidth)
                        currentGroupList = listAndWidth.list;
                });

            //Hide/show all elemnts in each group
            $.each(this.groupWidth, function(id){
                $allElements.filter('.group-'+id).toggle( currentGroupList.includes(id) );
            });
        },

        //**************************************************************************
        onCurrentRelativeChanged: function( currentRelative = 0 ){
            this.$container
                .toggleClass('time-is-past',   currentRelative < 0)
                .toggleClass('time-is-now',    currentRelative == 0)
                .toggleClass('time-is-future', currentRelative > 0);
        }
    };


    //**************************************************************************
    var elementSetList = [];

    nsTime.addElementSet = function( options ){
        var elementSet = new ElementSet( options );
        elementSetList.push(elementSet);
        return elementSet.$container;
    };



    //**************************************************************************
    nsTime.bottomMenu_onResize = function(){
        elementSetList.forEach( elementSet => {
            elementSet.update();
        });
    };


    /**************************************************************************
    nsTime.bottomMenu_onCurrentRelativeChanged( currentRelative )
    Calls onCurrentRelativeChanged for all elementSets in elementSetList
    onCurrentRelativeChanged change different class-names etc for the elements
    depending on the value of relative
    **************************************************************************/
    nsTime.bottomMenu_onCurrentRelativeChanged = function( currentRelative ){
        elementSetList.forEach( elementSet => {
            elementSet.onCurrentRelativeChanged( currentRelative );
        });
    };


}(jQuery, L, this, document));
