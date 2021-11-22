import i18next from 'i18next';
import { chain, flatten, isArray } from 'lodash';
import moment from 'moment';
import { getDateWithoutTimeZone } from '_core/utils/date';
import { getAverage } from '_core/utils/grades';
import { notificationsSubtypes } from '_core/utils/notifications';
import { cleanEventName, getGradientByDisciplineCourse, getIconType, getValidUrl } from '_core/utils/utils';
import { isEditorial, isStudent } from '_core/utils/user';
import { calculateUnitConsumption, getIconByDisciplineCourse } from './utils';

export function parseTasks(tasks = []) {
  return tasks.map((item) => {
    return { ...item, title: item.name };
  });
}

export function parseTasks2(tasks) {
  return tasks.map((item) => {
    return {
      ...item,
      name: item.lesson_item_name,
      title: item.lesson_item_name,
      date: moment(item.lesson_item_deliver_at).format('DD-MM-YYYY HH:mm'),
      dueDate: item.lesson_item_deliver_at,
      pending: item.jobs_delivered,
    };
  });
}

export function parseTasksForTaskPage(tasks) {
  return tasks.map((item) => {
    return {
      ...item,
      lessonName: item.lesson.name,
      section: item.section.name,
      name: item.lesson_item_name,
      title: item.lesson_item_name,
      date: moment(item.lesson_item_deliver_at).format('DD-MM-YYYY HH:mm'),
      dueDate: item.lesson_item_deliver_at,
      pending: item.jobs_delivered,
      evaluated: item.jobs_evaluated,
      noStarted: item.jobs_amount - item.jobs_delivered - item.jobs_evaluated,
      total: item.jobs_amount,
      participation: 20,
      autoevaluative: false,
    };
  });
}

export function parseTaskStudent(tasks = []) {
  return tasks.map((item) => {
    return {
      ...item,
      lessonName: item.lesson.name,
      section: item.section.name,
      name: item.lesson_item_name,
      title: item.lesson_item_name,
      date: moment(item.lesson_item_deliver_at).format('DD-MM-YYYY HH:mm'),
      dueDate: item.lesson_item_deliver_at,
      pending: item.jobs_delivered,
      evaluated: item.jobs_evaluated,
      noStarted: item.jobs_amount,
      questionsLength: item.test_amount_questions,
      status: parseTaskStatus(item),
      grade: item.job_score,
      gradeTotal: item.lesson_item_ranking_scale,
    };
  });
}

export function parseTaskStatus(task = {}) {
  const hoursLeft = moment(new Date(task.lesson_item_deliver_at)).diff(moment(new Date()), 'hours');
  const isLate = moment(new Date(task.lesson_item_deliver_at)).isBefore(new Date());

  if (task.job_status === 'pending' && isLate) return 'late';
  if (task.job_status === 'pending' && hoursLeft < 24) return 'soon';
  if (task.job_status === 'pending' && task.job_evaluated_by) return 'assessment-reassigned';
  if (task.job_status === 'pending' && hoursLeft > 24) return 'assessment-assigned';
  if (task.job_status === 'delivered') return 'turned-in';
  if (task.job_status === 'evaluated') return 'assessment-evaluated';
}

export function parseCourses(courses = []) {
  return courses.map((item) => {
    let configuration = null;
    try {
      configuration = item.config ? JSON.parse(item.config) : null;
    } catch (e) {
      console.log(e, 'error parseCourses');
    }

    return {
      ...item,
      level: item.education_level_name,
      studentsLength: item.users.filter((user) => user.role_guid === 'R01').length,
      letter: item.name.substr(0, 1).toUpperCase(),
      color: item.theme_color,
      configuration: configuration,
      hasTimetable: item.has_timetable,
    };
  });
}

export function parseCourse(course = {}) {
  return {
    ...course,
    gradient: course.education_discipline_guid ? getGradientByDisciplineCourse(course.education_discipline_guid) : null,
    disregarded: course.author_role_guid ? isEditorial(course.author_role_guid) : false,
  };
}

export function parseGroupsFromCourses(courses = []) {
  let groups = [];
  courses = chain(courses).groupBy('school_group_guid').value();
  Object.keys(courses).map(function (key, idx) {
    const group = courses[key][0];
    return groups.push({
      amount_students: group.studentsLength,
      education_level_guid: group.school_group_education_level_guid,
      education_level_name: group.school_group_education_level_name,
      education_year_guid: group.school_group_education_year_guid,
      education_year_name: group.school_group_education_year_name,
      guid: group.school_group_guid,
      is_active: 1,
      name: group.school_group_name,
      code: group.school_group_code,
    });
  });

  return groups;
}

export function parseEvents(events = []) {
  console.log('EVENTS: ', events);
  return events.map((item) => {
    return {
      ...item,
      name: item.title === 'CLASS' ? `(${i18next.t('lesson:No lesson assigned')})` : cleanEventName(item.title),
      title: item.title === 'CLASS' ? `(${i18next.t('lesson:No lesson assigned')})` : cleanEventName(item.title),
      start: item.start_at,
      type: item.type_name,
      course: {
        gradient: item.education_discipline_guid ? getGradientByDisciplineCourse(item.education_discipline_guid) : null,
        name: item.school_group_name,
      },
      lesson: {
        name: item.title === 'CLASS' ? `(${i18next.t('lesson:No lesson assigned')})` : cleanEventName(item.title),
      },
    };
  });
}

export function parseEventAddCourseName(events = []) {
  return events.map((item) => {
    return { ...item, name: item.course_name + ' - ' + item.title };
  });
}

export function parseUsers(users = []) {
  return users.map((item) => parseUser(item));
}

export function parseUser(user = {}) {
  user.lastName = user.lastname;
  user.thumbnail = user.avatar;
  user.guid = user.person_guid || user.guid;
  return user;
}

export function parseJobUsers(jobs = []) {
  return jobs.map((job) => {
    return parseJobUser(job);
  });
}

export function parseJobUser(job = {}) {
  return {
    ...job,
    job_guid: job.guid,
    name: job.student_name,
    lastName: job.student_lastname,
    email: job.student_email,
    guid: job.person_guid,
    score: job.score,
    thumbnail: job.student_avatar,
    turned: job.status !== 'pending',
  };
}

export function parseNotifications(notifications = []) {
  let notificationsParse = [];
  let currentNotification = null;

  for (let notification of notifications) {
    currentNotification = parseOneNotification(notification);
    if (currentNotification) {
      notificationsParse.push(currentNotification);
    }
  }

  return notificationsParse;
}

function getTextNotification(data, notification) {
  let text = data.message && data.message.parent_message ? data.message.parent_message.message : '';
  if (notification.type === notificationsSubtypes.SOCIAL.ASSESSMENTCOMMENT) {
    text = data.message.parentMessageData.lesson_item_content_name;
  }
  return text;
}

export function parseOneNotification(item) {
  try {
    let data = JSON.parse(item.data);
    // console.log('data: ', data);
    return {
      ...item,
      user: parseUser(data.user || data.student),
      data,
      viewAt: item.viewed_at,
      date: item.created_at,
      subtext: data.message ? data.message.message : null,
      text: getTextNotification(data, item),
      className: data.school_group ? data.school_group.name : '',
      courseName: data.course.name,
      consumedAt: item.consumed_at,
      unitName: data.section ? data.section.name : null,
      assessmentName: data.assesment ? data.assesment.name : null,
      isEvaluable: data.assesment && data.assesment.is_evaluable ? data.assesment.is_evaluable : 0,
      dueDate: data.deliver_at,
      course: {
        gradient: getGradientByDisciplineCourse(data.course.discipline_guid),
      },
    };
  } catch (e) {
    console.log(e, 'error parseOneNotification');
    return null;
  }
}

export function parseBooks(books = []) {
  return books.map((item) => {
    return { ...item, image: item.thumbnail, title: item.name, type: item.type_guid, program_guid: item.guid };
  });
}

export function parseBook(book) {
  return { ...book, image: book.thumbnail, title: book.name };
}

export function parsePrograms(programs = []) {
  return programs.map((item) => {
    return { ...item, guid: item.program.guid, image: item.publication.thumbnail, title: item.program.name };
  });
}

export function parseLicenses(licenses = []) {
  return licenses.map((item) => {
    return {
      ...item,
      start: item.linked_at,
      end: item.expires_at,
      name: item.program.name,
      thumbnail: item.program.picture,
      level: item.education_level ? item.education_level.name : '',
    };
  });
}

export function parseProgramsSignup(programs = []) {
  return programs.map((item) => {
    return {
      ...item,
      start: item.linked_at,
      end: item.expires_at,
      name: item.program.name,
      thumbnail: item.program.picture,
      level: item.education_year.name + ' ' + item.education_level.name,
    };
  });
}

export function parsePosts(posts = []) {
  return posts.map((item) => {
    return {
      ...item,
      pin: item.is_pinned,
      text: item.message,
      createdAt: item.created_at,
      commentsLength: item.amount_comments,
      user: { name: item.creator_name, lastname: item.creator_lasname, guid: item.creator_guid },
      comments:
        item.comments && item.comments.length > 0
          ? item.comments.map((commItem) => ({
              ...commItem,
              text: commItem.message,
              user: { name: commItem.creator_name, lastName: commItem.creator_lasname, avatar: commItem.creator_avatar },
            }))
          : [],
    };
  });
}

function getIcon(description) {
  let type = 'smartphone';
  if (description.includes('Electron')) {
    type = 'desktop';
    // } else if (description.includes('Android') || description.includes('iPhone')) {
    //   type = 'smartphone';
  } else if (description.includes('iPad')) {
    type = 'tablet';
  }

  return type;
}

export function parseDevices(devices = []) {
  return devices.map((item) => {
    return { ...item, type: getIcon(item.description) };
  });
}

export function getParseDisciplines() {
  return [
    { guid: 'ed1', discipline: 'All', iconType: 'science', gradient: 'linear-gradient(to top, #86e328, #00b775)' },
    { guid: 'ed10', discipline: 'Religion', iconType: 'language', gradient: 'linear-gradient(135deg, #FF5AC7 15.25%, #B53FEC 100%)' },
    { guid: 'ed11', discipline: 'Ethics', iconType: 'history', gradient: ' linear-gradient(135deg, #BF48F8 14.75%, #5714E7 100%)' },
    { guid: 'ed12', discipline: 'Art', iconType: 'art', gradient: ' linear-gradient(135deg, #FFAD31 14.75%, #F05432 100%)' },
    { guid: 'ed13', discipline: 'English', iconType: 'technology-language', gradient: 'linear-gradient(135deg, #2AECC9 14.5%, #01A8B3 100%)' },
    { guid: 'ed2', discipline: 'Math', iconType: 'maths', gradient: 'linear-gradient(135deg, #FF7171 14.75%, #E3284A 100%)' },
    { guid: 'ed3', discipline: 'Language', iconType: 'technology-language', gradient: 'linear-gradient(135deg, #2AECC9 14.5%, #01A8B3 100%)' },
    { guid: 'ed4', discipline: 'Plastics', iconType: 'class-book', gradient: 'linear-gradient(111.12deg, #FF5029 12.58%, #F91B6B 100%)' },
    { guid: 'ed5', discipline: 'Technology', iconType: 'technology-language', gradient: 'linear-gradient(135deg, #2AECC9 14.5%, #01A8B3 100%)' },
    { guid: 'ed6', discipline: 'Biology', iconType: 'science', gradient: 'linear-gradient(135deg, #86E328 15.25%, #00B775 100%)' },
    { guid: 'ed7', discipline: 'Social Sciences', iconType: 'geography', gradient: 'linear-gradient(135deg, #72C4FF 14.75%, #4325FA 100%)' },
    { guid: 'ed8', discipline: 'Geography', iconType: 'geography', gradient: 'linear-gradient(to top, #40afff, #361bdc)' },
    { guid: 'ed9', discipline: 'History', iconType: 'history', gradient: 'linear-gradient(135deg, #BF48F8 14.75%, #5714E7 100%)' },
  ];
}

export function parseCalendars(calendars = []) {
  if (calendars.length == 0) return calendars;

  let ar_icons = getParseDisciplines();

  return calendars.filter((c) => {
    try {
      const calendar = ar_icons.filter((_i) => _i.guid === c.education_discipline_guid)[0];
      c.iconType = calendar ? calendar.iconType : 'teacher';
      c.gradient = calendar ? calendar.gradient : 'linear-gradient(to top, #ff5029, #f91b6b)';
    } catch (_r) {}
    c.level = 'level';
    c.studentsLength = 0;
    return c;
  });
}

export function parseEventsCalendar(events = [], calendar) {
  return events.map((item) => {
    return {
      ...item,
      name: item.title === 'CLASS' ? `(${i18next.t('lesson:No lesson assigned')})` : cleanEventName(item.title),
      start: getDateWithoutTimeZone(new Date(item.start_at)),
      end: item.end_at ? getDateWithoutTimeZone(new Date(item.end_at)) : getDateWithoutTimeZone(new Date(item.start_at)),
      calendar: calendar.filter((ca) => ca.guid == item.calendar_guid)[0],
      lesson: item.lesson_guid || '',
      detail: item.description,
      type_icon: 'onsite',
      isTest: item.type_name === 'content',
      allDay: item.type_name === 'content',
      gradient: item.education_discipline_guid ? getGradientByDisciplineCourse(item.education_discipline_guid) : null,
      discipline_icon: item.education_discipline_guid ? getIconByDisciplineCourse(item.education_discipline_guid) : null,
    };
  });
}

function _title_status(_trimestre) {
  if (_trimestre.guid == 'notguid') {
    return 'pending';
  } else if (new Date(_trimestre.end_at) < new Date()) {
    return 'done';
  } else if (new Date(_trimestre.start_at) > new Date()) {
    return 'pending';
  } else {
    return 'current';
  }
}

function _title_quarter(_quarter_length, t) {
  switch (_quarter_length) {
    case 1:
      return t('section:Calendar steep anual');
    case 2:
      return t('section:Calendar steep semestre');
    case 3:
      return t('section:Calendar steep trimestre');
    case 4:
      return t('section:Calendar steep bimestre');
    default:
      return '';
  }
}

function reorganizeProgramUnits(quarterToOrder, lessonsToOrder) {
  quarterToOrder = quarterToOrder.map((quarter) => {
    quarter.units = [];
    lessonsToOrder.map((lesson) => {
      if (lesson.config) {
        try {
          let _unit = JSON.parse(lesson.config).trimestre_guid;
          if (_unit == quarter.guid) {
            quarter.units.push(lesson);
          }
        } catch (e) {
          console.log(e, 'error reorganizeProgramUnits');
        }
      }
    });
    return quarter;
  });

  return quarterToOrder;
}

export function parseAllProgramV2(_quarter, _lessonss, t, user, _callback) {
  _quarter = reorganizeProgramUnits(_quarter, _lessonss);

  let _tempate_quarter = {
    guid: 'notguid',
    name: t('section:Calendar steep planeador'),
    units: [],
  };

  let listOfFoundUnits = flatten(_quarter.map((singleQuarter) => singleQuarter.units)).map((item) => item.guid);

  _lessonss.map((lesson) => {
    if (lesson.config && listOfFoundUnits.indexOf(lesson.guid) > -1) {
      try {
        let _unit_re = JSON.parse(lesson.config).trimestre_guid;
        if (!_unit_re || _unit_re == 'notguid') {
          _tempate_quarter.units.push(lesson);
        }
      } catch (e) {
        console.log(e, 'error parseAllProgramV2');
      }
    } else {
      _tempate_quarter.units.push(lesson);
    }
  });

  var _quarter_length = _quarter.length;
  var _quarter_index_rest = 0;

  if (_tempate_quarter.units.length > 0 || _quarter.length == 0) {
    _quarter.unshift(_tempate_quarter);
    _quarter_length = _quarter.length - 1;
    _quarter_index_rest = 1;
  }

  var fullProgram = _quarter.map((_trimestre, _ix) => {
    console.log('_trimestre: ', _trimestre);
    return {
      ..._trimestre,
      status: _title_status(_trimestre),
      start: _trimestre.end_at,
      guid: _trimestre.guid,
      name:
        _trimestre.name || (_quarter_length === 1 ? _title_quarter(_quarter_length, t) : _ix - _quarter_index_rest + 1 + _title_quarter(_quarter_length, t)),
      end: _trimestre.start_at,
      start_at: _trimestre.start_at,
      end_at: _trimestre.end_at,
      units: _trimestre.units.map((_unidade) => {
        return parseUnit(_unidade);
      }),
    };
  });

  _callback(fullProgram);
}

function parseUnit(_unidade) {
  //console.log(_unidade.order +' - '+_unidade.section)

  var _stus = '';
  _unidade.items.map((_lesson) => {
    _stus = new Date(_lesson.lesson_to_date) < new Date() ? 'done' : 'pending';
  });

  return {
    ..._unidade,
    date: _unidade.lesson_to_date,
    name: _unidade.section || '---',
    showDate: true,
    status: _stus,
    lessons: _unidade.items.map((_lesson) => {
      return {
        ..._lesson,

        date: _lesson.lesson_from_date,
        duration: '-', //lesson_from_date - lesson_to_date
        learningObjectives: [],
        name: _lesson.lesson_name || '.....',
        isToday: moment(_lesson.lesson_from_date).isSame(moment(), 'day'),
        showDate: true,
        status: parseStatusUnit(_lesson),
        type: 'online',
      };
    }),
  };
}

export function parseStudentUnits(units) {
  return units.map((unit) => {
    return { ...unit, consumption: calculateUnitConsumption(unit) };
  });
}

function parseStatusUnit(_lesson) {
  const isNotOnPast = new Date(_lesson.lesson_from_date) < new Date();
  const isNotOnFuture = new Date(_lesson.lesson_to_date) >= new Date();

  if (isNotOnPast && isNotOnFuture) {
    return 'current';
  } else if (isNotOnPast) {
    return 'done';
  } else {
    return 'pending';
  }
}
// UNIT ADD
export function parseAddUnit(_unit, _program, position, time, _callback) {
  var _arr = [];
  var _pos = 0;

  var newUnit = _unit;
  newUnit.date = newUnit.lesson_to_date;
  newUnit.name = newUnit.section || '---';
  newUnit.showDate = true;
  newUnit.status = 'done';
  newUnit.lessons = [];

  for (var i = 0; i < _program.times.length; i++) {
    if (time.guid == _program.times[i].guid) {
      _arr = _program.times[i].units;
      _pos = i;
    }
  }

  const insert = (arr, index, newItem) => [
    // part of the array before the specified index
    ...arr.slice(0, index),
    // inserted item
    newItem,
    // part of the array after the specified index
    ...arr.slice(index),
  ];

  let _ret = insert(_arr, position, newUnit);
  console.log(_ret);

  console.log('==============================');
  console.log(_pos);
  console.log(_program.times);
  console.log(_program.times[_pos]);

  if (_program.times.length == 0) {
    _program.times = [];
    _program.times.push({ units: _ret });
  } else {
    _program.times[_pos].units = _ret;
  }
  _callback(_program);
}

export function parseReorderUnitAndLesson(_program, _callback, haveToGetProgram = false) {
  let _reorder = [];
  let _order = 1;
  let trimestres = _program.times;

  for (var i = 0; i < trimestres.length; i++) {
    for (var j = 0; j < trimestres[i].units.length; j++) {
      // Unidades
      _reorder.push({
        guid: trimestres[i].units[j].guid,
        name: trimestres[i].units[j].section,
        order: _order,
        parent_guid: trimestres[i].units[j].parent_guid,
      });
      _order++;

      // Lección
      for (var z = 0; z < trimestres[i].units[j].lessons.length; z++) {
        _reorder.push({
          guid: trimestres[i].units[j].lessons[z].guid,
          name: trimestres[i].units[j].lessons[z].lesson_name,
          order: _order,
          parent_guid: trimestres[i].units[j].lessons[z].parent_guid,
        });
        _order++;
      }
    }
  }

  _callback(_reorder, haveToGetProgram);
}

export function unitMoveUpDown(moviment, unit, _program, _callback) {
  var mustUpdate = true;
  let trimGuid = null;
  try {
    trimGuid = unit.config ? JSON.parse(unit.config).trimestre_guid : null;
  } catch (e) {
    console.log(e, 'error unitMoveUpDown');
  }

  let trim = {};

  let positionTrim = 0;
  let positionUnit = 0;

  _program.times.map((item, i) => {
    positionTrim = item.guid == trimGuid ? i : positionTrim;
    return {
      ...item,
      units: item.units.map((_unit, j) => {
        positionUnit = unit.guid == _unit.guid ? j : positionUnit;
      }),
    };
  });
  var newPosition;
  // Move unit UP
  if (moviment == 'up') {
    if (positionUnit > 0) {
      trim = _program.times[positionTrim];
      newPosition = positionUnit - 1;
      const result = _program.times[positionTrim].units;
      const [removed] = result.splice(positionUnit, 1);
      result.splice(newPosition, 0, removed);
      _program.times[positionTrim].units = result;
    } else {
      if (positionTrim == 0) {
        mustUpdate = false;
      } else {
        // eliminando unidad del trimestre
        _program.times = _program.times.map((item) => filterUnit(item, unit));

        // agregar unidad a trimestre anterior
        _program.times[positionTrim - 1].units.push(unit);
        trim = _program.times[positionTrim - 1];
      }
    }
  } else {
    // Move unit DOWN

    // llega al tope
    if (positionTrim >= _program.times.length - 1 && positionUnit >= _program.times[positionTrim].units.length - 1) {
      mustUpdate = false;
    } else {
      mustUpdate = true;
      trim = _program.times[positionTrim];

      // Unidada no llega a tope de trimestre
      if (positionUnit < _program.times[positionTrim].units.length - 1) {
        newPosition = positionUnit + 1;
        const result = _program.times[positionTrim].units;
        const [removed] = result.splice(positionUnit, 1);
        result.splice(newPosition, 0, removed);

        _program.times[positionTrim].units = result;
      } else {
        // Unidada llega a tope de trimestre
        // eliminando unidad del trimestre
        _program.times = _program.times.map((item) => filterUnit(item, unit));

        // agregar unidad a trimestre anterior
        _program.times[positionTrim + 1].units.unshift(unit);
        trim = _program.times[positionTrim + 1];
      }
    }
  }

  _callback(_program, mustUpdate, trim, unit);
}

function filterUnit(item, unit) {
  return {
    ...item,
    units: item.units.filter((_unit) => {
      return _unit.guid != unit.guid;
    }),
  };
}
export function reorderAfterCreateLesson(_program, response, data, _callback) {
  // Localizando ID de lesson
  var _custom_guid = response.data.data.guid;
  var _ar = _custom_guid.split('-');
  _ar[0] = _ar[0].substring(0, _ar[0].length - 1) + '1';
  _custom_guid = _ar.join('-');

  let newUnit = response.data.data;
  newUnit.guid = _custom_guid;
  newUnit.name = data.title;

  let unitGUID = data.parent_guid;
  let positionTrim = 0;
  let positionUnit = 0;

  _program.times.map((item, i) => {
    return {
      ...item,
      units: item.units.map((_unit, j) => {
        if (_unit.guid == unitGUID) {
          positionUnit = j;
          positionTrim = i;
        }
      }),
    };
  });

  //lessons
  let _arr = _program.times[positionTrim].units[positionUnit].lessons;
  let position = data.order;
  const insert = (arr, index, newItem) => [...arr.slice(0, index), newItem, ...arr.slice(index)];
  let _retu = insert(_arr, position, newUnit);
  _program.times[positionTrim].units[positionUnit].lessons = _retu;
  _callback(_program);
}

export function reorderUnitsAndLesson(_lesson, _program, _callback) {
  let positionTrim = 0;
  let positionUnit = 0;
  _program.times.map((trim, i) => {
    return {
      ...trim,
      units: trim.units.map((unit, j) => {
        return {
          ...unit,
          lessons: unit.lessons.map((lesson, z) => {
            if (lesson.guid == _lesson.guid) {
              positionUnit = j;
              positionTrim = i;
            }
          }),
        };
      }),
    };
  });

  const result = _program.times[positionTrim].units[positionUnit].lessons;
  const [removed] = result.splice(_lesson.start, 1);
  result.splice(_lesson.end, 0, removed);
  _program.times[positionTrim].units[positionUnit].lessons = result;

  _callback(_program);
}

/* LESSON PAGE */

export function parseLearningObjectives(lo = []) {
  return lo.map((l) => {
    return { ...l, name: l.learning_objective, tooltipText: l.description, tooltipTitle: l.learning_objective };
  });
}

export function parseBooksOfCourse(_books = []) {
  return _books.map((l) => {
    return { ...l, courseName: 'NONE', guid: l.guid, image: l.thumbnail || '', progress: 0, title: l.name, type: l.type_guid };
  });
}

export function getConsumption(user, item) {
  let consumption = 0;
  if (isStudent(user) && item.job_status === 'delivered') {
    consumption = 100;
  } else if (!isStudent(user)) {
    consumption = item.item_jobs_progress;
  }

  return consumption ? consumption : 0;
}

export function parseAllLesson(_mock, _course, _lesson, _sections, _user) {
  //return _mock;
  return {
    //..._mock,
    name: _lesson.name,
    date: _lesson.lesson_from_date,
    unitName: _lesson.section && _lesson.section.name ? _lesson.section.name : '',
    consumption: 0,
    guid: _lesson.guid,
    classSuccess: 0,
    type: 'online',
    learningObjectives: _lesson.learningObjectives.map((l) => {
      return { ...l, tooltipText: l.description, tooltipTitle: l.name };
    }),
    status: 'done',
    showDate: true,
    duration: _lesson.lessonDuration,
    sections: _sections.map((_sec) => {
      return {
        ..._sec,
        name: _sec.section,
        guid: _sec.guid,
        items: _sec.items.map((_item) => {
          return parseLessonItem(_item, _user, null);
        }),
      };
    }),
  };
}

export function parseLessonItem(_item, _user, _currentLesson, _callback) {
  var commonItems = _item;
  commonItems.contentName = _item.content_name;
  commonItems.contentDescription = _item.description;
  commonItems.type = _item.content_type_guid;
  commonItems.isPublisher = _item.author_guid == _user.guid || !_item.author_guid ? false : true;
  commonItems.additional = false;
  commonItems.jobStatus = _item.job_status;
  commonItems.comments = [];
  commonItems.consumption = getConsumption(_user, _item);
  commonItems.assigned = _item.item_for == 'all' ? i18next.t('common:All students') : _item.item_for_users.split(',').length - 1;

  commonItems.typeItem = 'content';

  if (_item.content_type_guid == 'CTTY_09' || _item.content_type_guid == 'CTTY_14') {
    // TEST o tarea
    commonItems.typeItem = 'assigment';
    commonItems.dateProgrammed = _item.published_at;
    commonItems.dateDelivery = _item.deliver_at;
    commonItems.questionsLength = '-';
    commonItems.averageTime = '-';
    commonItems.students = [];
    commonItems.turned = 0;
    commonItems.graded = 0;
  } else if (_item.content_type_guid == 'CTTY_07') {
    // imagen
    commonItems.understanding = 0;
    commonItems.likes = 4;
    commonItems.contentUrl = _item.content_url;
  }

  if (_currentLesson) {
    _currentLesson.sections = _currentLesson.sections.map((_sec) => {
      var __secItems = _sec.items;
      if (_sec.guid == commonItems.parent_guid) {
        __secItems.push(commonItems);
      }
      return {
        ..._sec,
        items: __secItems,
      };
    });
  }

  if (_callback) {
    _callback(_currentLesson);
  } else {
    return commonItems;
  }
}

export function parseContent(c, token) {
  return { ...c, type: c.type_guid, contentUrl: getValidUrl(c.url, token), contentName: c.name, contentDescription: '' };
}

export function parseQuestions(questions = []) {
  return questions.map((question, idx) => parseQuestion({ ...question, number: idx + 1 }));
}

export function parseQuestion(question = {}) {
  return { ...question, id: question.question_guid, pointsTotal: question.ranking_scale };
}

export function parseAnswers(payload) {
  if (payload === null || payload === undefined) return [];
  let parsed = null;

  try {
    parsed = JSON.parse(payload);
  } catch (e) {
    console.log(e, 'error parseAnswers');
  }

  if (isArray(parsed)) {
    return parsed;
  } else {
    return parsed.answers;
  }
}

export function parseFeedback(payload) {
  if (payload === null || payload === undefined) return {};
  let parsed = null;
  try {
    parsed = JSON.parse(payload);
  } catch (e) {
    console.log(e, 'error parseAnswers');
  }
  if (isArray(payload)) {
    return {};
  } else {
    return parsed;
  }
}

export function parseAnswer(answer = {}) {
  return { score: answer.score || 0 };
}

export function parseProjectionItems(t, items = []) {
  return items.map((item) => {
    return parseProjectionItem(t, item);
  });
}

function getIconProjectionItem(item, isBook) {
  let icon = getIconType(item.type);
  if (isBook) {
    icon = 'book-open';
  } else if (parseTypesForOCViewer(item.type) === 'test' && item.content_is_evaluable) {
    icon = 'task2';
  }
  return icon;
}

function getTextTypeProjectionItem(item, isBook) {
  let text = i18next.t(`types-resources:${item.content_type_guid}`);
  if (isBook) {
    text = i18next.t('courses:Lessons');
  } else if (parseTypesForOCViewer(item.type) === 'test' && item.content_is_evaluable) {
    text = i18next.t('assigments:Evaluative assignment');
  } else if (parseTypesForOCViewer(item.type) === 'test' && !item.content_is_evaluable) {
    text = i18next.t('assigments:Formative assignment');
  }
  return text;
}

export function parseProjectionItem(t, item = {}) {
  const isBook = item.type_guid === 'CTTY_01' || item.type_guid === 'CTTY_02';
  return {
    ...item,
    icon: getIconProjectionItem(item, isBook),
    type: isBook ? (item.type_guid === 'CTTY_02' ? 'mint_book' : 'pdf') : parseTypesForOCViewer(item.type),
    type_name: getTextTypeProjectionItem(item, isBook),
    text: item.name,
    isBook: isBook,
  };
}
export function getAgroupUnitsByLessons(lessons = []) {
  const units = [];
  let findUnit = null;
  for (const lesson of lessons) {
    if (lesson.parent_guid) {
      findUnit = units.find((unit) => unit.guid === lesson.parent_guid);
      if (findUnit) {
        findUnit.lessons.push(parseLessonOfGradebook(lesson));
      } else {
        units.push({
          guid: lesson.parent_guid,
          name: lesson.parent_section,
          lessons: [parseLessonOfGradebook(lesson)],
        });
      }
    }
  }
  return units;
}

export function getAgroupByCalendar(timetable = [], t) {
  const times = [];
  for (const time of timetable) {
    times.push({
      name: timetable.length === 1 ? _title_quarter(timetable.length, t) : times.length + 1 + _title_quarter(timetable.length, t),
      guid: time.guid,
    });
  }
  // times.push({
  //   name: 'No planificada',
  //   guid: 'notguid',
  // });

  return times;
}

export function parseLessonOfGradebook(lesson) {
  return {
    name: lesson.lesson_name,
    guid: lesson.lesson_guid,
    assessments: lesson.lessonItems.map((item) => parseAssesmentOfGradebook(item)),
  };
}

export function parseAssesmentOfGradebook(assesment) {
  return { name: assesment.name, guid: assesment.guid };
}

export function isPassDeliveryAt(assesment, job) {
  return !assesment.can_deliver_late && assesment.deliver_at < job.delivered_at;
}

export function getJobScore(assesment, job) {
  let score = '-';
  if (isPassDeliveryAt(assesment, job)) {
    score = 0;
  } else if (job.status === 'evaluated') {
    score = job.score;
  }
  return score;
}

function getNewAssessment(guid, name, status, score) {
  return {
    guid: guid,
    name: name,
    status: status,
    score: score,
  };
}

function getStudents(users) {
  let students = [];
  for (const user of users.filter((itemUser) => isStudent(itemUser))) {
    students.push({ user: { ...parseUser(user), guid: user.person_guid }, units: [] });
  }

  return students;
}

function isAssessmentForStudent(lessonItem, studentGuid) {
  // return lessonItem.item_for === 'all' || (lessonItem.item_for === 'some-users' && lessonItem.item_for_users.includes(studentGuid));
  // lo comento por si se acaba cambiando, ahora solo se veran los assesments para todos los users
  return lessonItem.item_for === 'all';
}

function getNewLesson(lesson, lessonItem, job) {
  return {
    guid: lesson.lesson_guid,
    name: lesson.lesson_name,
    assessments: [getNewAssessment(lessonItem.guid, lessonItem.name, isPassDeliveryAt(lessonItem, job) ? 'late' : job.status, getJobScore(lessonItem, job))],
  };
}

function getNewUnit(lesson, lessonItem, job) {
  let timetable = null;
  try {
    timetable = lesson.parent_config ? JSON.parse(lesson.parent_config) : null;
  } catch (e) {
    console.log(e, 'error getNewUnit');
  }

  return {
    guid: lesson.parent_guid,
    name: lesson.parent_section,
    timetable: timetable,
    lessons: [getNewLesson(lesson, lessonItem, job)],
  };
}

function putJobsToUser(dataToTable, lessonItem, lesson) {
  let currentUnit = null;
  let currentLesson = null;
  for (const job of lessonItem.job) {
    const currentUser = dataToTable.find((item) => item.user.guid === job.student_guid);

    if (isAssessmentForStudent(lessonItem, job.student_guid)) {
      currentUnit = currentUser.units.find((unit) => unit.guid === lesson.parent_guid);
      if (currentUnit) {
        currentLesson = currentUnit.lessons.find((itemLesson) => itemLesson.guid === lesson.lesson_guid);
        if (currentLesson) {
          currentLesson.assessments.push(
            getNewAssessment(lessonItem.guid, lessonItem.name, isPassDeliveryAt(lessonItem, job) ? 'late' : job.status, getJobScore(lessonItem, job))
          );
        } else {
          currentUnit.lessons.push(getNewLesson(lesson, lessonItem, job));
        }
      } else {
        currentUser.units.push(getNewUnit(lesson, lessonItem, job));
      }
    }
  }

  return dataToTable;
}

export function parseDataServerToFormatSimpleTable(lessons = [], users = []) {
  let dataToTable = getStudents(users);

  for (const lesson of lessons) {
    for (const lessonItem of lesson.lessonItems) {
      dataToTable = putJobsToUser(dataToTable, lessonItem, lesson);
    }
  }

  for (const data of dataToTable) {
    for (const unit of data.units) {
      for (const lesson of unit.lessons) {
        lesson.score = getAverage(lesson.assessments);
      }
      unit.score = getAverage(unit.lessons);
    }
    data.score = getAverage(data.units);
  }

  return dataToTable;
}

export function getAgroupDataToRanking(lessons, users) {
  const data = parseDataServerToFormatSimpleTable(lessons, users);
  return data.map((item) => ({ ...item, ...item.user }));
}

function getAverageAssignment(assessment, parseData) {
  let sum = 0;

  for (const user of parseData) {
    for (const unit of user.units) {
      for (const lesson of unit.lessons) {
        for (const assessmentItem of lesson.assessments) {
          if (assessmentItem.guid === assessment.guid) {
            if (assessmentItem.score !== '-') {
              sum += parseFloat(assessmentItem.score);
            }
          }
        }
      }
    }
  }

  return sum === 0 ? 0 : sum / parseData.length;
}

function getAverageAssignmentUnitsAndTimes(item, parseData, attr = 'units') {
  let sum = 0;

  for (const user of parseData) {
    for (const unit of user[attr]) {
      if (unit.guid === item.guid) {
        if (unit.score !== '-') {
          sum += parseFloat(unit.score);
        }
      }
    }
  }

  return sum === 0 ? 0 : sum / parseData.length;
}

function getElementToDataGraphic(items, parseData, user, initData, selectedStudents) {
  let currentAssessment = null;

  for (const assessment of items) {
    currentAssessment = parseData.find((item) => item.guid === assessment.guid);
    if (currentAssessment) {
      currentAssessment[user.user.guid] = assessment.status === 'evaluated' ? assessment.score : 0;
    } else if (!currentAssessment) {
      let data = {
        name: assessment.name,
        guid: assessment.guid,
      };
      data[user.user.guid] = assessment.status === 'evaluated' ? assessment.score : 0;
      data[i18next.t('grades:Average')] = getAverageAssignment(assessment, initData);
      parseData.push(data);
    }
  }

  return parseData;
}

export function getAgroupDataToGraphicAssigments(lessons, users, selectedStudents) {
  let parseData = [];
  const data = parseDataServerToFormatSimpleTable(lessons, users);
  for (const user of data) {
    for (const unit of user.units) {
      for (const lesson of unit.lessons) {
        parseData = getElementToDataGraphic(lesson.assessments, parseData, user, data, selectedStudents);
      }
    }
  }

  return parseData;
}

export function getAgroupDataToTableCalendar(lessons, users, timetable, t) {
  let times = [];
  const data = parseDataServerToFormatSimpleTable(lessons, users);
  for (const student of data) {
    times = [];

    for (let timetableItem of timetable) {
      times.push({
        name: timetable.length === 1 ? _title_quarter(timetable.length, t) : times.length + 1 + _title_quarter(timetable.length, t),
        guid: timetableItem ? timetableItem.guid : '',
        units: [],
      });
    }

    for (const unit of student.units) {
      const currentTime = times.find((item) => unit.timetable && item.guid === unit.timetable.trimestre_guid);
      if (currentTime) {
        currentTime.units.push(unit);
      } else {
        const findTime = timetable.find((item) => unit.timetable && item.guid === unit.timetable.trimestre_guid);
        if (findTime) {
          times.push({
            name: timetable.length === 1 ? _title_quarter(timetable.length, t) : times.length + 1 + _title_quarter(timetable.length, t),
            guid: findTime ? findTime.guid : '',
            units: [unit],
          });
        }
        // else {
        //   let timesFound = times.find((item) => item.guid === 'notguid');
        //   if (timesFound) {
        //     timesFound.units.push(unit);
        //   } else {
        //     times.push({
        //       name: 'No planificada',
        //       guid: 'notguid',
        //       units: [unit],
        //     });
        //   }
        // }
      }
    }
    student.times = times;
  }

  for (const student of data) {
    for (const time of student.times) {
      time.score = getAverage(time.units);
    }
  }

  return data;
}

function agroupDataToGraphicCalendarUnits(data, attributeOfUser, selectedStudents) {
  const parseData = [];
  let newData = {};
  let currentUnit = null;
  for (const user of data) {
    for (const unit of user[attributeOfUser]) {
      currentUnit = parseData.find((item) => item.guid === unit.guid);
      if (currentUnit) {
        currentUnit[user.user.guid] = unit.score !== '-' ? unit.score : 0;
      } else if (!currentUnit) {
        newData = {
          name: unit.name,
          guid: unit.guid,
        };
        // if (selectedStudents.find((item) => item.guid === user.user.guid)) {
        // if (unit.score !== '-') {
        newData[user.user.guid] = unit.score !== '-' ? unit.score : 0;
        // }
        // }

        newData[i18next.t('grades:Average')] = getAverageAssignmentUnitsAndTimes(unit, data, attributeOfUser);
        parseData.push(newData);
      }
    }
  }

  return parseData;
}
export function getAgroupDataToGraphicCalendar(lessons, users, timetable, t, selectedStudents) {
  return agroupDataToGraphicCalendarUnits(getAgroupDataToTableCalendar(lessons, users, timetable, t), 'times', selectedStudents);
}

export function getAgroupDataToGraphicUnits(lessons, users, selectedStudents) {
  return agroupDataToGraphicCalendarUnits(parseDataServerToFormatSimpleTable(lessons, users), 'units', selectedStudents);
}

export function parseTypesForOCViewer(type) {
  if (type === 'CTTY_09') return 'test';
  if (type === 'CTTY_07') return 'image';
  if (type === 'CTTY_05') return 'pdf';
  if (type === 'CTTY_04') return 'audio';
  if (type === 'CTTY_03') return 'video';
  if (type === 'CTTY_06') return 'link';
}

export function parseLessonItemToExport(lessons = []) {
  return flatten(
    lessons.map((lesson) => {
      return lesson.lessonItems.map((item) => {
        return { ...item, lesson_name: lesson.lesson_name, unit_name: lesson.parent_section };
      });
    })
  );
}

export function parseMessages(messages = []) {
  return messages
    .sort(function (a, b) {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    })
    .map((message) => {
      return parseMessage(message);
    });
}

export function parseMessage(message = {}) {
  return { ...message, text: message.message, createdAt: message.created_at };
}
