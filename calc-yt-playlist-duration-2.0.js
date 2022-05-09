// NOTE: Load all the videos of the playlist by scrolling till the end, otherwise script cannot trace all video items

'use strict';

class YouTubePlaylistDurationCalculator {
  constructor({ enableLogging = false }) {
    this.LOGGING_ENABLED = enableLogging;
  }

  insertJQuery() {
    new Promise((resolve, reject) => {
      if (this.LOGGING_ENABLED) console.log('[insertJQuery]', 'invoked');

      for (const script of document.scripts) {
        if (script.src.includes('jquery')) {
          if (this.LOGGING_ENABLED)
            console.log('[insertJQuery]', 'jquery script found, not including');
          resolve(null);
          return; // TODO: Required?
        }
      }

      const script = document.createElement('script');
      script.onload = () => resolve(null);
      script.onerror = () => reject(new Error('Unable to load jquery library'));

      if (this.LOGGING_ENABLED)
        console.log('[insertJQuery]', 'adding jquery script');

      script.src =
        'https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js';
      document.head.append(script);
    });
  }

  getSecsFromString = (string = '') => {
    return string
      .split(':')
      .reverse()
      .map((e, i) => +e * Math.pow(60, i))
      .reduce((p, c) => p + c);
  };

  calcSecsToTime = (secs = 0) => {
    const DAY = 86400;
    const HOUR = 3600;
    const MINUTE = 60;

    const days = Math.floor(secs / DAY);
    const hrs = Math.floor((secs - days * DAY) / HOUR);
    const mins = Math.floor((secs - (days * DAY + hrs * HOUR)) / MINUTE);
    secs = secs % MINUTE;

    let string = '';
    [
      { value: days, text: 'day' },
      { value: hrs, text: 'hour' },
      { value: mins, text: 'minute' },
      { value: secs, text: 'second' },
    ].forEach(({ value, text }) => {
      if (value > 0) {
        if (string) string += ', ';
        string += `${value} ${text}`;
        if (value > 1) string += 's';
      }
    });

    if (this.LOGGING_ENABLED)
      console.log('[calcSecsToTime]', {
        days,
        hrs,
        mins,
        secs,
        string,
      });

    return {
      days,
      hrs,
      mins,
      secs,
      string,
    };
  };

  stripAndCalculateDuration = () => {
    if (this.LOGGING_ENABLED)
      console.log('[stripAndCalculateDuration]', 'invoked');

    let i = 0,
      totalSecs = 0;
    for (const video of $(
      'ytd-playlist-video-list-renderer div#contents'
    ).children()) {
      ++i;
      const title = $(video).find('a#video-title').text().trim(),
        durationString = $(video)
          .find('span#text.ytd-thumbnail-overlay-time-status-renderer')
          .text()
          .trim();

      if (this.LOGGING_ENABLED)
        console.log(
          '[stripAndCalculateDuration]',
          `stripped info: sr=${
            i + 1
          }, title=${title}, duration=${durationString}, previous secs sum=${totalSecs}`
        );

      totalSecs += getSecsFromString(durationString);
    }

    if (this.LOGGING_ENABLED)
      console.log('[stripAndCalculateDuration]', { totalSecs });

    const timeDuration = calcSecsToTime(totalSecs);
    if (this.LOGGING_ENABLED)
      console.log('[stripAndCalculateDuration]', { timeDuration });

    return timeDuration;
  };

  insertTimeDurationInHTML = duration => {
    if (this.LOGGING_ENABLED)
      console.log('[insertTimeDurationInHTML]', 'invoked');

    const statsElement = $('#stats.ytd-playlist-sidebar-primary-info-renderer');
    const durationSpan = statsElement.find('span#playlist-total-duration');
    if (durationSpan.length) {
      if (this.LOGGING_ENABLED)
        console.log('[insertTimeDurationInHTML]', 'updating duration span');

      $(durationSpan).text(`(⏱ ${duration.string})`);
    } else {
      if (this.LOGGING_ENABLED)
        console.log('[insertTimeDurationInHTML]', 'inserting duration span');

      statsElement.prepend(
        `<span id='playlist-total-duration'>(⏱ ${duration.string})</span><br/>`
      );
    }
  };

  initDurationCalculation = () => {
    try {
      this.insertJQuery()
        .then(() => {
          this.insertTimeDurationInHTML(this.stripAndCalculateDuration());
        })
        .catch(e => {
          throw e;
        });
    } catch (e) {
      alert('Script error: ' + e.message);
    }
  };
}

initDurationCalculation();
