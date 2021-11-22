import { defaultConfig } from 'app/config/environment';
import { flatten } from 'lodash';
import moment from 'moment/moment';
import { isEditorial, isStudent } from '_core/utils/user';

/**
 * Funciones utiles comunes para cualquier archivo js
 */

/**
 * Devuelve true si estamos en modo debug
 */
export function isModeDebug() {
  return !isModeProduction();
}

export function isModeProduction() {
  return process.env.NODE_ENV === 'production';
}

export function isInPublisher(defaultConfig) {
  return (defaultConfig.PUBLISHER_DOMAIN && window.location.hostname.indexOf(defaultConfig.PUBLISHER_DOMAIN) !== -1) || false;
}

/**
 * Devuelve las opciones traduciendo su campo label
 * @param {array} options
 * @param {function} t
 */
export function getOptionsTranslateLabel(options, t) {
  const optionsToRet = [];
  options &&
    options.map((option) => {
      optionsToRet.push({ ...option, label: t(option.label) });
    });
  return optionsToRet;
}

/**
 * Copia un text al portapapeles
 * @param {string} text
 */
export function copyClipboard(text) {
  navigator.clipboard.writeText(text);
}

/**
 * Parse File to base64
 * @param {object} file
 */
export function parseFileToBase64(file) {
  var file = file;

  return new Promise((resolve, reject) => {
    var reader = new FileReader();
    reader.readAsBinaryString(file);
    reader.onload = function () {
      resolve(btoa(reader.result));
    };
    reader.onerror = function () {
      reject();
    };
  });
}

export function getDateFileFormat() {
  let now = new Date();
  return '' + now.getFullYear() + now.getMonth() + now.getDay() + now.getHours() + now.getMinutes();
}

export const getDateFormatted = (date) => {
  const dateDate = new Date(date);
  return moment(dateDate).format('DD-MM-YYYY hh:mm:ss');
};

// para el core
export function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function getNameFile(url) {
  const split = url.split('/');
  const name = split[split.length - 1];
  return name;
}

export var debounce = (function () {
  let timer = 0;
  return function (callback, ms) {
    clearTimeout(timer);
    timer = setTimeout(callback, ms);
  };
})();

export var getCurrentMYSQLDate = function () {
  var date;
  date = new Date();
  date =
    date.getUTCFullYear() +
    '-' +
    ('00' + (date.getMonth() + 1)).slice(-2) +
    '-' +
    ('00' + date.getDate()).slice(-2) +
    ' ' +
    ('00' + date.getHours()).slice(-2) +
    ':' +
    ('00' + date.getMinutes()).slice(-2) +
    ':' +
    ('00' + date.getSeconds()).slice(-2);

  return date;
};

export function getIconByDisciplineCourse(discipline) {
  let icons = [
    { guid: 'ed1', iconType: 'science' },
    { guid: 'ed10', iconType: 'chess' },
    { guid: 'ed11', iconType: 'chess' },
    { guid: 'ed12', iconType: 'chess' },
    { guid: 'ed2', iconType: 'maths' },
    { guid: 'ed3', iconType: 'language' },
    { guid: 'ed4', iconType: 'chess' },
    { guid: 'ed5', iconType: 'chess' },
    { guid: 'ed6', iconType: 'chess' },
    { guid: 'ed7', iconType: 'chess' },
    { guid: 'ed8', iconType: 'geography' },
    { guid: 'ed9', iconType: 'history' },
  ];

  let theIcon = icons.find((icon) => icon.guid === discipline);

  return theIcon ? theIcon.iconType : 'science';
}

export function calculateUnitConsumption(unit) {
  const lessons = unit.lessons;
  if (lessons.length === 1) return lessons[0].progress.progress;
  const allProgress = flatten(lessons.map((item) => item.progress));
  let averageProgress = allProgress.map((item) => item.progress).reduce((a, b) => a + b);
  if (!averageProgress) averageProgress = 0;
  else {
    averageProgress = averageProgress / allProgress.length;
  }
  return averageProgress;
}

export function isDisregardedProgram(course, user) {
  return course.author_role_guid && isStudent(user) ? isEditorial(course.author_role_guid) : false;
}

export function getExerciseCover(question_type_guid) {
  const covers = [
    { guid: 'QT_1', name: 'multiple-choice-single' },
    { guid: 'QT_10', name: 'text' },
    { guid: 'QT_11', name: 'select' },
    { guid: 'QT_12', name: 'drag_and_drop' },
    { guid: 'QT_13', name: 'clasification' },
    { guid: 'QT_14', name: 'match_list' },
    { guid: 'QT_15', name: 'order' },
    { guid: 'QT_16', name: 'linking_lines' },
    { guid: 'QT_17', name: 'short' },
    { guid: 'QT_18', name: 'large' },
    { guid: 'QT_19', name: 'other' },
    { guid: 'QT_2', name: 'multiple-choice-multiple' },
    { guid: 'QT_20', name: 'draw' },
    { guid: 'QT_21', name: 'click_to_find' },
    { guid: 'QT_3', name: 'multiple-choice-true-false' },
    { guid: 'QT_4', name: 'multiple-choice-block-letter' },
    { guid: 'QT_5', name: 'choice-matrix-table' },
    { guid: 'QT_6', name: 'choice-matrix-inline' },
    { guid: 'QT_7', name: 'text' },
    { guid: 'QT_8', name: 'drag_and_drop' },
    { guid: 'QT_9', name: 'math' },
  ];

  let selectedCover = covers.find((cover) => cover.guid === question_type_guid);

  return selectedCover ? selectedCover.name : null;
}

export function getExerciseLabel(elements, t) {
  return elements
    .map((element) => {
      return {
        ...element,
        label: t('types-questions:' + element['guid']),
      };
    })
    .sort(function (a, b) {
      return a.label > b.label ? 1 : a.label < b.label ? -1 : 0;
    });
}

export function s2ab(s) {
  var buf = new ArrayBuffer(s.length); //convert s to arrayBuffer
  var view = new Uint8Array(buf); //create uint8array as viewer
  for (var i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xff; //convert to octet
  return buf;
}

export function parseScore(score) {
  try {
    score = parseFloat(score.replace(',', '.'));
  } catch (ex) {}
  return parseFloat(score || 0);
}

export const calculateScore = (numberOfQuestions, rankingScaleOfTest, indexOfQuestion, wasTouched, currentScore) => {
  if (wasTouched) return currentScore;

  if (indexOfQuestion + 1 === numberOfQuestions) {
    return (
      Math.round(
        100 *
          (rankingScaleOfTest -
            numberOfQuestions * parseFloat(rankingScaleOfTest / numberOfQuestions).toFixed(2) +
            rankingScaleOfTest / numberOfQuestions +
            Number.EPSILON || getEpsilon())
      ) / 100
    );
  }

  return parseFloat(rankingScaleOfTest / numberOfQuestions).toFixed(2);
};
// helper for the above calculate score
const getEpsilon = () => {
  var e = 1.0;
  while (1.0 + 0.5 * e !== 1.0) e *= 0.5;
  return e;
};

/**
 * Prevent objects to be duplicated inside an array of objects
 * Uses a key to filter
 * @param {The actual array} list
 * @param {The new items to add to the array} newItems
 * @param {The property to filter the duplicates} key
 */
export function cleanObjectDuplicates(list, newItems, key) {
  let ids = new Set(list.map((d) => d[key]));
  return [...list, ...newItems.filter((d) => !ids.has(d[key]))];
}

export function getUrlBackoffice() {
  const url = defaultConfig.BASE_URL_.split('//');
  return url[0] + (defaultConfig.BASE_URL_.includes('tangerine.oneclick.es') ? '//publisher.' : '//backoffice.') + url[1];
}
