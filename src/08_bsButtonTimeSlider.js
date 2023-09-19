/****************************************************************************
bsButtonTimeSlider.js

Methods to add mini time-slider to a button incl swiping and panning
****************************************************************************/
(function ($, L, moment, i18next, window/*, document, undefined*/) {
	"use strict";

    var ns        = window.fcoo = window.fcoo || {},
        nsMap     = ns.map = ns.map || {},
        nsTime    = nsMap.time = nsMap.time || {};


    var margin = 3; //Left and right margin in slider (%)

    function getPercent( currentRelative, timeMode = nsTime.timeMode ){
        var tmOptions = nsTime.timeOptions.timeModeOptions[timeMode];
        return margin + (100 - 2*margin) * (currentRelative - tmOptions.min) / (tmOptions.max - tmOptions.min);
    }

    var panStartedAtPx,
        panStartedAtRelative,
        hourPrPx;

    function onPan( event ){
        var $target;
        switch (event.type){
            case 'swipeleft'  :
                nsTime.getCurrentTimeModeData().setDelta( -1 );
                break;

            case 'swiperight' :
                nsTime.getCurrentTimeModeData().setDelta( +1 );
                break;

            case 'panstart'   :
                $target = $(event.target);

                $target.addClass('slide-button-panning');

                panStartedAtPx = event.gesture.deltaX;

                hourPrPx = $target.data('range') / $target.width();

                panStartedAtRelative = nsTime.getCurrentTimeModeData().data.currentRelative;

                break;

            case 'panmove'  :
                var newRelative = Math.round( panStartedAtRelative + (event.gesture.deltaX - panStartedAtPx) * hourPrPx );
                nsTime.getCurrentTimeModeData().set(newRelative);
                break;

            case 'panend'   :
            case 'pancancel':
                $(event.target).removeClass('slide-button-panning');
                break;
        }
    }


    nsTime.createSliderButton = function( timeMode, $elem ){
        //Calculate the relative size 'the past' and 'the furture' from the min and max for the mode
        $elem
            .addClass('slider-button fa-sort-up')
            .css('background',
                    'linear-gradient(to right, '+
                        nsTime.pastBgColor+' '+ getPercent(0, timeMode)+'%, '+
                        nsTime.futureBgColor+' 0%) '+
                    'no-repeat bottom right');

        if (window.bsIsTouch){
            //Add pan and sswipe events to the button

            //Save the relative range for the button
            var tmOptions = nsTime.timeOptions.timeModeOptions[timeMode];
            $elem.data('range', tmOptions.max - tmOptions.min);

            //Add Hammer to the button
            $elem.hammer();
            $elem.on('panstart panmove panend pancancel swipeleft swiperight', onPan);
        }
    };

    nsTime.updateSliderButtons = function( currentRelative ){
        document.documentElement.style.setProperty('--slider-button-left', getPercent(currentRelative)+'%');
    };

}(jQuery, L, window.moment, window.i18next, this, document));




