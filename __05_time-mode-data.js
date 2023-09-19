/****************************************************************************
05_time-mode-data.js

****************************************************************************/
(function ($, L, moment, i18next, window/*, document, undefined*/) {
	"use strict";

    var ns        = window.fcoo = window.fcoo || {},
        nsMap     = ns.map = ns.map || {},
        nsTime    = nsMap.time = nsMap.time || {},
        unit      = nsTime.unit || 'hour',

        forceTimeUpdate = false;    //if true the set-function in MANGLER forces updating all time element, maps etc.


    /***************************************
    GLOBAL TIME-VARIABLES
    ***************************************/
    //nowMoment = moment-object representing 'now' in hole hours. Is changed every 60 minutes at hole hour (16:00:00, 17:00:00 etc)
    nsTime.nowMoment = moment().startOf(unit);
/*
    nsTime.tmFixed     = 'FIXED';
    nsTime.tmRelative  = 'RELATIVE';
    nsTime.tmSelect    = 'SELECT';
    nsTime.tmAnimation = 'ANIMATION';

    nsTime.timeMode = nsTime.tmFixed;
*/

    /***************************************
    TIME-MODE-DATA
    TimeModeData = object with methods and data for a specific timeMode
    TimeModeData.data = {
        currentMoment   : MOMENT
        currentRelative : NUMBER
        min             : NUMBER
        max             : NUMBER
        globalMin       : NUMBER
        globalMax       : NUMBER
        start           : NUMBER
        end             : NUMBER
    }
    Contains the current values and range for the different time-modes

    ***************************************/
    nsTime.timeModeData = {};

    nsTime.TimeModeData = function( mode ){
        this.mode = mode;

        var to  = nsTime.timeOptions,
            tmo = to.timeModeOptions;
        this.data = {
            min       : tmo[mode].min,
            max       : tmo[mode].max,
            globalMin : to.min,
            globalMax : to.max,
            start     : tmo[mode].start,
            end       : tmo[mode].end,

            currentRelative: 0,
            currentMoment  : nsTime.nowMoment.clone()
        }
        this.isRelative = nsTime.timeModeIsRelative(mode);

        //Add the time-mode data to application-settings
        ns.appSetting.add({
            id          : 'time_'+mode,
            callApply   : true,
            applyFunc   : this.apply.bind(this),
            defaultValue: {currentRelative: 0}
        });

    }

    nsTime.TimeModeData.prototype = {
        apply: function( data ){
            //If this TimeModeData is fixed and a absolute moment is saved => Use this moment if it is not in the past
            if (!this.isRelative && data.currentMomentISO){
                this.data.currentMoment = moment(data.currentMomentISO);
                if (this.data.currentMoment.isBefore(nsTime.nowMoment))
                    this.data.currentMoment = nsTime.nowMoment.clone();
            }

            //Set currentMoment after currentRelative or currentRelative after currentMoment depending on this.isRelative
            if (this.isRelative)
                this.data.currentMoment = moment(nsTime.nowMoment).add(this.data.currentRelative, unit);
            else
                this.data.currentRelative = this.data.currentMoment.diff(nsTime.nowMoment, unit);
        },

        set: function( relative ){
            this.data.currentRelative = relative;
            this.adjust();

            this.data.currentMoment = moment(nsTime.nowMoment).add(this.data.currentRelative, unit);

            this.save();

            this.updateBottomMenuElements();
        },

        setDelta: function( delta ){
            this.set( this.data.currentRelative + delta );
        },

        adjust: function(){
            this.data.currentRelative = window.roundToRange(this.data.currentRelative, this.data.min, this.data.max);
        },

        updateBottomMenuElements: function(redrawTimeSlider){
            var currentRelative = this.data.currentRelative,
                $body = $('body'); //skal være bottom menu MANGLER

            //Update elements in bottom-menu with current time and current relative
            $body.find('.is-current-moment').vfValue(this.data.currentMoment);

            //Releative time needs to be relative to 'true now' = moment()
            $body.find('.is-current-relative').vfValue( moment().add(currentRelative, unit) );

            //Enable/disable forward and backward buttons
            var isFirst = currentRelative == this.data.min,
                isLast  = currentRelative == this.data.max;

            $body.find('.btn-time-step-backward').css('border-color', isFirst ? 'red' : 'green');
            $body.find('.btn-time-step-forward').css('border-color', isLast ? 'red' : 'green');


            //Update style etc. for all elementSets
            nsTime.bottomMenu_onCurrentRelativeChanged(currentRelative);


        },

        updateMaps: function(){
            nsMap.callAllMaps('_updateTime', [this.data]);
        },


        onNowChanged: function(){
            //Called when now cahnged: Check if not relative modes still are inside the range
            if (!this.isRelative){
                var firstMoment = moment(nsTime.nowMoment).add(this.data.min, unit);
                if (this.data.currentMoment.isBefore(firstMoment) )
                    this.set( this.data.min );
            }
        },

        save: function(){
            var data = {
                    currentRelative: this.data.currentRelative
                }
            if (!this.isRelative && this.data.currentMoment)
                data.currentMomentISO = this.data.currentMoment.format();
            ns.appSetting.set('time_'+this.mode, data);
            ns.appSetting.save();
        }






    }
    //***************************************************************

















    /***************************************
    GLOBAL TIME-VARIABLES
    ***************************************/
// HER>     //nowMoment = moment-object representing 'now' in hole hours. Is changed every 60 minutes at hole hour (16:00:00, 17:00:00 etc)
// HER>     nsTime.nowMoment = moment().startOf(unit);

// HER>     //currentMoment = moment representing the current moment data on the map is displayed at
// HER>     nsTime.currentMoment  = moment(nsTime.nowMoment);

// HER>     //currentRelative = relative hour-value representing the current moment data. Saved in application-settings (see below)
// HER>     nsTime.currentRelative = 0;

// HER>     //currentAnimation = {start, end} relative hour-value representing the start and end of animation
// HER>     nsTime.currentAnimation = {start:0, end:24};


    /***************************************
    EVENTS
    There are four events fired when any of the moment-variables are changed:
    now-moment-changed, current-moment-changed, current-relative-changed, time-mode-changed
    ***************************************/
    //Create global events to be fired when now, current time or time mode is changed
    ['NOWMOMENTCHANGED', /*'CURRENTMOMENTCHANGED',*/ 'CURRENTRELATIVECHANGED', 'TIMEMODECHANGED'].forEach( eventName => {
        ns.events[ eventName ] = eventName;
        ns.events.eventNames.push( eventName );
    });

    /***************************************
    set(newNow, newCurrent, newRelative)
    When one of nsTime.nowMoment, nsTime.currentMoment, or nsTime.currentRelative is changed one of the two other variable is calculated
    Witch one that is recalculated dependes on nsTime.timeMode is relative or fixed/absolute mode
    ***************************************/
/*
    function set(newNow, newCurrent, newRelative){
return;

        var previousNow      = moment( nsTime.nowMoment ),
            previousCurrent  = moment( nsTime.currentMoment ),
            previousRelative = nsTime.currentRelative;

        if (newNow){
            nsTime.nowMoment = moment( newNow );
            if (nsTime.timeModeIsRelative())
                nsTime.currentMoment = moment(nsTime.nowMoment).add(nsTime.currentRelative, unit);
            else {
                nsTime.currentMoment = nsTime.currentMoment || moment(nsTime.nowMoment);
                nsTime.currentRelative = nsTime.currentMoment.diff(nsTime.nowMoment, unit);
            }
        }
        else

        if (newCurrent){
            nsTime.currentMoment = moment( newCurrent );
            nsTime.currentRelative = nsTime.currentMoment.diff(nsTime.nowMoment, unit);
        }
        else

        if (newRelative !== false){
            nsTime.currentRelative = newRelative;
            nsTime.currentMoment = moment(nsTime.nowMoment).add(nsTime.currentRelative, unit);
        }


        //Check that the new time is within the range nsTime.timeOptions.min -> nsTime.timeOptions.max
        if (nsTime.currentRelative !== null){
            newRelative = Math.max( nsTime.timeOptions.min, Math.min( nsTime.currentRelative, nsTime.timeOptions.max) );
            if (newRelative != nsTime.currentRelative){
                nsTime.setCurrentRelative( newRelative );
                return;
            }
        }

        if (!nsTime.timeReady) return;

        var data = {
                now             : nsTime.nowMoment,
                nowMoment       : nsTime.nowMoment,
                current         : nsTime.currentMoment,
                currentMoment   : nsTime.currentMoment,
                relative        : nsTime.currentRelative,
                currentRelative : nsTime.currentRelative
            },
            updateMaps = false;

        if (forceTimeUpdate || !previousNow || !previousNow.isSame(nsTime.nowMoment)){
            ns.events.fire('NOWMOMENTCHANGED', data);
            updateMaps = true;
        }
// HER>         if (forceTimeUpdate || !previousCurrent || !previousCurrent.isSame(nsTime.currentMoment)){
// HER>             ns.events.fire('CURRENTMOMENTCHANGED', data);
// HER>             updateMaps = true;
// HER>         }

        if (forceTimeUpdate || !previousRelative || (previousRelative != nsTime.currentRelative)){
            ns.events.fire('CURRENTRELATIVECHANGED', data);
            ns.appSetting.data['currentRelative'] = nsTime.currentRelative;
            ns.appSetting.save();
            updateMaps = true;
        }

        if (updateMaps){
            nsMap.callAllMaps('_updateTime', []);

// HER>             //Update elements in bottom-menu with current time and current relative
// HER>             $('body').find('.is-current-moment').vfValue(nsTime.currentMoment);
// HER>
// HER>             //Releative time needs to be relative to 'true now' = moment()
// HER>             $('body').find('.is-current-relative').vfValue( moment().add(nsTime.currentRelative, unit) );

        }

        forceTimeUpdate = false;
    }
*/
    /******************************************************************
    nsTime.setNowMoment()
    nsTime.setCurrentMoment( newCurrentMoment )
    nsTime.setCurrentRelative( newCurrentRelative )
    nsTime.setCurrentAnimation( startAndEnd )
    ******************************************************************/
    nsTime.setNowMoment       = function()                       { set( moment().startOf(unit), false,            false             ); };
// HER>     nsTime.setCurrentMoment   = function( newCurrentMoment )     { set( false,                  newCurrentMoment, false             ); };
// HER>     nsTime.setCurrentRelative = function( newCurrentRelative = 0){ set( false,                  false,            newCurrentRelative); };

// HER>     nsTime.setCurrentAnimation = function( startAndEnd ){
// HER>         nsTime.currentAnimation = startAndEnd;
// HER>         ns.appSetting.data['currentAnimation'] = nsTime.currentAnimation;
// HER>         ns.appSetting.save();
// HER>
// HER>         //TODO: Update whatever need to be updated
// HER>     };



    /******************************************************************
    SAVE TIME-SETTINGS
    ******************************************************************/
// HER>     //Add currentRelative and currentAnimation to application-settings
// HER>     ns.appSetting.add({
// HER>         id          : 'currentRelative',
// HER>         callApply   : false,
// HER>         applyFunc   : nsTime.setCurrentRelative,
// HER>         defaultValue: 0
// HER>     });
// HER>     ns.appSetting.add({
// HER>         id          : 'currentAnimation',
// HER>         callApply   : false,
// HER>         applyFunc   : nsTime.setCurrentAnimation,
// HER>         defaultValue: {start:0, end:24}
// HER>     });



    function setNowMoment( dummy, now ){
        nsTime.nowMoment = (now ? now : moment()).startOf(unit);
    }

    //Add init-function to be called at the end of creating the site
    nsMap.addFinallyEvent(function(){
        nsTime.timeReady = true;
        forceTimeUpdate = true;

        if (window.FCOOMAPSTIME_TEST_NOW){
            //TEST: now is 'moved' 1 hour every 10 seconds


            var testNow = moment().startOf(unit);
            var intervals = new window.Intervals({durationUnit: 'seconds'});
            intervals.addInterval({
                duration: 10,
                data    : {},
                resolve : function(){
                    testNow.add(1, unit);
                    setNowMoment( {}, testNow);
                    console.log('Now = ', testNow.toString());
                }
            });
            window.__jbs_getNowMoment = function(){ return moment(testNow); }


        }
        else
            window.intervals.addInterval({
                duration: moment.duration(1, unit).asMinutes(),
                data    : {},
                resolve : setNowMoment
            });
    });

}(jQuery, L, window.moment, window.i18next, this, document));