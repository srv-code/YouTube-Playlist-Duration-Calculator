// NOTE: Load all the videos of the playlist by scrolling till the end, otherwise script cannot trace all video items

'use strict';

class YouTubePlaylistDurationCalculator {
  constructor() {
    this.LOGGING_ENABLED = false;
  }

  insertJQuery() {
    return new Promise((resolve, reject) => {
      if (this.LOGGING_ENABLED) console.log('[insertJQuery]', 'invoked');

      for (const script of document.scripts) {
        if (script.src.includes('jquery')) {
          if (this.LOGGING_ENABLED)
            console.log('[insertJQuery]', 'jquery script found, not including');
          resolve(null);
          return;
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

  getSecsFromString(string = '') {
    return string
      .split(':')
      .reverse()
      .map((element, index) => +element * Math.pow(60, index))
      .reduce((prev, current) => prev + current);
  }

  calcSecsToTime(secs = 0) {
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
  }

  stripAndCalculateDuration() {
    if (this.LOGGING_ENABLED)
      console.log('[stripAndCalculateDuration]', 'invoked');

    if (this.LOGGING_ENABLED)
      console.groupCollapsed('[stripAndCalculateDuration]', 'stripped info');
    let videoIndex = 0;
    let totalSecs = 0;
    for (const videoElement of $(
      'ytd-playlist-video-list-renderer div#contents'
    ).children()) {
      videoIndex++;
      const title = $(videoElement).find('a#video-title').text().trim(),
        durationString = $(videoElement)
          .find('span#text.ytd-thumbnail-overlay-time-status-renderer')
          .text()
          .trim();

      if (this.LOGGING_ENABLED)
        console.log(
          `[${videoIndex}] title=${title}, duration=${durationString}, previous secs sum=${totalSecs}`
        );

      totalSecs += this.getSecsFromString(durationString);
    }

    if (this.LOGGING_ENABLED) {
      console.groupEnd();
      console.log('[stripAndCalculateDuration]', { totalSecs });
    }

    const timeDuration = this.calcSecsToTime(totalSecs);
    if (this.LOGGING_ENABLED)
      console.log('[stripAndCalculateDuration]', { timeDuration });

    return { timeDuration, videoCount: videoIndex };
  }

  insertTimeDurationInHTML({ timeDuration, videoCount }) {
    if (this.LOGGING_ENABLED)
      console.log('[insertTimeDurationInHTML]', 'invoked', {
        timeDuration,
        videoCount,
      });

    const statsElement = $('#stats.ytd-playlist-sidebar-primary-info-renderer');
    const durationSpan = statsElement.find('span#playlist-total-duration');
    const text = `⏱ ${timeDuration.string} for ${videoCount} videos`;
    if (durationSpan.length) {
      if (this.LOGGING_ENABLED)
        console.log('[insertTimeDurationInHTML]', 'updating duration span');

      $(durationSpan).text(text);
    } else {
      if (this.LOGGING_ENABLED)
        console.log('[insertTimeDurationInHTML]', 'inserting duration span');

      statsElement.prepend(
        `<span id='playlist-total-duration'>${text}</span><br/>`
      );
    }
  }

  run({ enableLogging = false } = {}) {
    if (enableLogging) console.log('run', 'invoked', { enableLogging });

    try {
      this.LOGGING_ENABLED = enableLogging;
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
  }
}

const durationCalculator = new YouTubePlaylistDurationCalculator();
durationCalculator.run({ enableLogging: true });
