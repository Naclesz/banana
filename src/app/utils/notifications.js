import { isNotificationTypeSocial, isNotificationTypeToDo, notificationsSubtypes } from '../../_core/utils/notifications';

export function getRouteToClickInNotification(notification) {
  console.log('getRouteToClickInNotification: ', notification);
  let pathname = ``;
  let state = {};
  if (isNotificationTypeSocial(notification.type)) {
    if (notification.type === notificationsSubtypes.SOCIAL.ASSESSMENTCOMMENT) {
      pathname = `/course/${notification.data.course.guid}/lesson/${notification.data.message.parentMessageData.lesson_guid}`;
    } else {
      pathname = `/course/${notification.data.course.guid}`;
    }

    if (notification.type === notificationsSubtypes.SOCIAL.ASSESSMENTCOMMENT) {
      state.postGuid = notification.data.message.parentMessageData.lesson_item_guid;
    } else if (notification.type === notificationsSubtypes.SOCIAL.COMMENT) {
      state.postGuid = notification.data.message.parent_guid;
    } else {
      state.postGuid = notification.data.message.guid;
    }
  } else if (isNotificationTypeToDo(notification.type)) {
    if (notification.type === notificationsSubtypes.TODO.EVALUATED) {
      pathname = `/results-assesment-individual/${notification.data.lesson_item.guid}/user/${notification.person_guid}`;
    } else if (
      notification.type === notificationsSubtypes.TODO.DELIVERATCOMPLETE ||
      notification.type === notificationsSubtypes.TODO.ALLDELIVER ||
      notification.type === notificationsSubtypes.TODO.PUBLISHPENDING
    ) {
      pathname = `/course/${notification.data.course.guid}/lesson/${notification.data.lesson.guid}/results-assessment/${notification.data.lesson_item.guid}`;
    } else if (notification.type === notificationsSubtypes.TODO.STUDENTDELIVER) {
      pathname = `/results-assesment-individual/${notification.data.lesson_item.guid}/user/${notification.user.guid}`;
    } else {
      pathname = `/course/${notification.data.course.guid}/lesson/${notification.data.lesson.guid}/assessment/${notification.data.lesson_item.guid}`;
    }
  }
  return { pathname, state };
}

export function getTextNotificationsUnread(notificationsUnread) {
  let text = notificationsUnread;
  if (notificationsUnread >= 10) {
    text = '9+';
  }
  if (notificationsUnread >= 100) {
    text = '99+';
  }
  return text;
}
