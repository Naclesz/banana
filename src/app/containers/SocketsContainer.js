import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from '_core/hooks/useRouter';
import actionsSocketsProject from '_core/socket/modules/actions';
import SocketNotifications from '_core/socket/modules/notifications';
import SocketToProject from '_core/socket/modules/toProject';
import * as coreEntities from '_core/store/index';
import { notificationsSubtypes, notificationsTypes } from '_core/utils/notifications';
import { mobileCheck } from '../../_core';
import { parseOneNotification } from '../utils/parses';

const SocketsContainer = () => {
  const authToken = useSelector((state) => coreEntities.auth.selectors.getAuthToken(state));
  const currentCourse = useSelector((state) => coreEntities.courses.selectors.getCurrentCourse(state));
  const currentCourseRef = useRef(currentCourse);
  currentCourseRef.current = currentCourse;
  const dispatch = useDispatch();
  const router = useRouter();

  const [socket, setSocket] = React.useState(null);
  const [socketBroadcast, setSocketBroadcast] = React.useState();
  const socketRef = useRef(socket);
  socketRef.current = socket;

  const socketBroadcastRef = useRef(socketBroadcast);
  socketBroadcastRef.current = socketBroadcast;

  // useEffect(() => {
  //   onConnect();
  // }, []);

  useEffect(() => {
    const socketToNotifications = new SocketNotifications(authToken, onActionSocket);
    setSocket(socketToNotifications);
    socketToNotifications.connect();

    const socketToBroadcast = new SocketToProject(authToken, null, onBroadCast);
    setSocketBroadcast(socketToBroadcast);
    socketToBroadcast.connect();
    if (mobileCheck()) {
      socketToBroadcast.onPhoneConnected();
    }
    if (!authToken) {
      disconnectSocket();
    }
  }, [authToken]);

  function disconnectSocket() {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    if (socketBroadcastRef.current) {
      socketBroadcastRef.current.changePhoneConnected(false);
      socketBroadcastRef.current.disconnect();
    }
    setSocket(undefined);
    setSocketBroadcast(undefined);
  }

  useEffect(() => {
    window.addEventListener('beforeunload', (ev) => {
      disconnectSocket();
      ev.preventDefault();
      return null;
    });
    return () => {
      disconnectSocket();
    };
  }, []);

  function onBroadCast(message) {
    if (
      mobileCheck() &&
      message.action === actionsSocketsProject.PING &&
      message.payload.socketType === 'toproject' &&
      !window.document.location.pathname.includes('remote')
    ) {
      router.history.push(`/remote`);
    }
    if (
      mobileCheck() &&
      authToken !== message.payload.token &&
      message.payload.socketType === 'toproject' &&
      !window.document.location.pathname.includes('remote')
    ) {
      router.history.push(`/remote`);
    }

    if (message.action === actionsSocketsProject.ON_PHONE_CONNECTED) {
      dispatch(coreEntities.projection.actions.setPhoneConnected({ isConnected: true }));
    } else if (message.action === actionsSocketsProject.CHANGE_PHONE_CONNECTED) {
      dispatch(
        coreEntities.projection.actions.setPhoneConnected({
          isConnected: false,
        })
      );
    }
  }

  function onActionSocket(message) {
    console.log(message, 'mensaje recibido por socket');
    let parseNotification = parseOneNotification(message);
    if (
      (message && message.type === notificationsSubtypes.SOCIAL.COMMENT) ||
      (message && message.type === notificationsSubtypes.SOCIAL.POST) ||
      (message && message.type === notificationsSubtypes.SOCIAL.ASSESSMENTCOMMENT)
    ) {
      dispatch(coreEntities.notifications.actions.addNotification(message, notificationsTypes.SOCIAL));
      if (currentCourseRef.current.guid === message.course_guid) {
        dispatch(
          coreEntities.courses.actions.addOneMessage({
            ...parseNotification.data.message,
            creator_name: parseNotification.data.user.name,
            creator_lasname: parseNotification.data.user.lastName,
            creator_avatar: parseNotification.data.user.avatar,
            parent_message: {
              ...parseNotification.data.message.parent_message,
            },
          })
        );
      }
    } else {
      dispatch(coreEntities.notifications.actions.addNotification(message, notificationsTypes.TODO));
    }
  }

  return <></>;
};

export default SocketsContainer;
