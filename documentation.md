# Technical Documentation


Extention to github/fcoo/fcoo-maps to have time-dependencies layers and to add bottom-menu with time-selector, add time-controls to the maps, and add options for time-sync in application-settings


## Time-mode
In multi-map-mode in fcoo-maps there are different ways to select time for the main map and for the 1-4 secondary maps
in single-map-mode the map is as main amp

### Main Map
The main map can one of  four time-modes:

- FIXED       : Select time from range - typical between -1day to +2-5days
- RELATIVE    : Select time as relative to current time ("Now") - typical between -24 hours - +48 hours
- SELECT      : Select a specific date or range of dates **- Not implemented**
- ANIMATION   : Animation over a range of time-steps (fromTime - toTime) **- Not implemented**


### Secondary map(s)
The time for the secondary map(s) is always relative to either

1. The main map
2. Current time (Now)
The time can be +/- 24 hours relative to 1. or 2.


## L.Control.BsTimeInfoControl
Control to show time

For main map: Show A clock-icon [, current time] (E.q. "14:00")

For secondary map(s): Show A clock-icon, [current time,] relative to main map or Now (E.q. "18:00 | + 4h")
It also give access to the "Time Setting" in map-setting where mode and (for secondary maps) relative Shift is selected


## Global variables and events
### name-space

    var ns = window.fcoo;
    var nsTime = window.fcoo.map.time;

<!--

### Global variables


### Global events
There are two groups of event.

1. Events fired when different *"modes"* changes.
2. Events when any of the moment-variables are changed

#### Mode-events
[fcoo-global-events](https://github.com/FCOO/fcoo-global-events) sets up a number of global events

The relevant global events are `LANGUAGECHANGED`, `DATETIMEFORMATCHANGED`, `TIMEZONECHANGED`, and `CREATEAPPLICATIONFINALLY`


In package [fcoo-moment](https://github.com/FCOO/fcoo-moment) event `DATETIMEFORMATCHANGED` are also fired when the language or the time zone is changed => only needs to listen for `DATETIMEFORMATCHANGED`

A new global event `TIMEMODECHANGED` is added and fired when the time-mode changes


#### Moment-events

Three global events are added and fired when any of the moment-variables are changed

| Variable          |Event-name |
|----------         |-------------|
| `nowMoment`       |`NOWMOMENTCHANGED`|
| `currentRelative` |`CURRENTRELATIVECHANGED` |
| `currentAnimation`| Not implemented |

-->
## Bottom-menu
The content of the bottom-menu (slider, buttons, info about current time etc.) are created in
`src/10_bottom-menu-elements.js`, `src/12_bottom-menu-elements-timeSilder.js`, and `src/20_bottom-menu-content.js`

There are tree different sizes for the bottom-menu named `bottom-menu-size` with abbreviation: `bms`:

- Minimized: Only buttons
- Normal: Buttons and small time-slider (a la range)
- Extended: Buttons and full time-slider







