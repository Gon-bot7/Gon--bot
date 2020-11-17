import {
  Chat,
  Contact,
  ContactStatus,
  GroupCreation,
  HostDevice,
  Id,
  Message,
  PartialMessage,
  WhatsappProfile,
} from '../api/model';

interface WAPI {
  addParticipant: (groupId: string, contactId: string) => boolean;
  allNewMessagesListener: (callback: Function) => void;
  archiveChat: (chatId: string, option: boolean) => boolean;
  arrayBufferToBase64: (buffer: ArrayBuffer) => string;
  blockContact: (messageId: string) => boolean;
  checkNumberStatus: (contactId: string) => any;
  clearChat: (chatId: string) => void;
  createGroup: (
    groupName: string,
    contactId: string | string[]
  ) => GroupCreation;
  deleteConversation: (chatId: string) => boolean;
  deleteMessages: (
    contactId: string,
    messageId: string[] | string,
    onlyLocal: boolean
  ) => any;
  demoteParticipant: (groupId: string, contactId: string) => void;
  downloadFile: (data: string) => Promise<string | boolean>;
  forwardMessages: (
    to: string,
    messages: string | string[],
    skipMyMessages: boolean
  ) => any;
  getAllChats: () => Chat[];
  getAllChatsWithMessages: (withNewMessageOnly?: boolean) => Chat[];
  getAllChatsWithNewMsg: () => Chat[];
  getAllContacts: () => Contact[];
  getAllMessagesInChat: (
    chatId: string,
    includeMe: boolean,
    includeNotifications: boolean
  ) => Message[];
  getAllNewMessages: () => any;
  getAllUnreadMessages: () => PartialMessage[];
  getBatteryLevel: () => number;
  getBlockList: () => Contact[];
  getBusinessProfilesProducts: (to: string) => any;
  getChat: (contactId: string) => Chat;
  getChatById: (contactId: string) => Chat;
  getChatIsOnline: (chatId: string) => Promise<boolean>;
  getLastSeen: (chatId: string) => Promise<number | boolean>;
  getContact: (contactId: string) => Contact;
  getGroupAdmins: (groupId: string) => Contact[];
  getGroupInfoFromInviteLink: (inviteCode: string) => Promise<string | boolean>;
  getGroupInviteLink: (chatId: string) => Promise<string>;
  getGroupParticipantIDs: (groupId: string) => Id[];
  getHost: () => HostDevice;
  getListMute: (type?: string) => object;
  getMessageById: (messageId: string) => Message;
  getNumberProfile: (contactId: string) => WhatsappProfile;
  getProfilePicFromServer: (chatId: string) => string;
  getSessionTokenBrowser: (removePath?: boolean) => void;
  getStatus: (contactId: string) => ContactStatus;
  getTheme: () => string;
  getUnreadMessages: (
    includeMe: boolean,
    includeNotifications: boolean,
    useUnreadCount: boolean
  ) => any;
  getWAVersion: () => string;
  isConnected: () => boolean;
  isLoggedIn: () => boolean;
  joinGroup: (groupId: string) => Promise<string | boolean>;
  killServiceWorker: () => boolean;
  leaveGroup: (groupId: string) => any;
  loadAndGetAllMessagesInChat: (
    chatId: string,
    includeMe: boolean,
    includeNotifications: boolean
  ) => Message[];
  loadEarlierMessages: (contactId: string) => Message[];
  markUnseenMessage: (messageId: string) => boolean;
  onAddedToGroup: (callback: Function) => any;
  onIncomingCall: (callback: Function) => any;
  onLiveLocation: (chatId: string, callback: Function) => any;
  onParticipantsChanged: (groupId: string, callback: Function) => any;
  onStateChange: (callback: Function) => void;
  openChat: (chatId: string) => boolean;
  openChatAt: (
    chatId: string,
    messageId: string
  ) => { wasVisible: boolean; alignAt: string };
  pinChat: (
    chatId: string,
    option: boolean,
    nonExistent?: boolean
  ) => Promise<object>;
  promoteParticipant: (groupId: string, contactId: string) => void;
  removeParticipant: (groupId: string, contactId: string) => void;
  reply: (to: string, content: string, quotedMsg: string) => any;
  restartService: () => boolean;
  sendChatstate: (chatState: string, chatId: string) => void;
  sendContactVcard: (
    to: string,
    contact: string,
    name?: string
  ) => Promise<object>;
  sendContactVcardList: (to: string, contacts: string[]) => Promise<object>;
  sendFile: (
    base64: string,
    to: string,
    filename: string,
    caption: string,
    type?: string
  ) => Promise<object>;
  sendImage: (
    imgBase64: string,
    to: string,
    filename: string,
    caption?: string
  ) => Promise<object>;
  sendImageAsSticker: (
    webpBase64: string,
    to: string,
    metadata?: any,
    type?: string
  ) => object;
  sendImageAsStickerGif: (
    webpBase64: string,
    to: string,
    metadata?: any
  ) => object;
  sendImageWithProduct: (
    base64: string,
    to: string,
    caption: string,
    bizNumber: string,
    productId: string
  ) => any;
  sendLinkPreview: (
    chatId: string,
    url: string,
    title: string
  ) => Promise<object>;
  sendLocation: (
    to: string,
    latitude: string,
    longitude: string,
    title: string
  ) => Promise<object>;
  sendMessage: (to: string, content: string) => Promise<any>;
  sendMessageMentioned: (...args: any) => any;
  sendMessageOptions: (chat: any, content: any, options?: any) => any;
  sendMessageWithThumb: (
    thumb: string,
    url: string,
    title: string,
    description: string,
    chatId: string
  ) => void;
  sendMute: (id: string, time: number, type: string) => Promise<object>;
  sendPtt: (
    base64: string,
    to: string,
    filename: string,
    caption: string
  ) => any;
  sendVideoAsGif: (
    base64: string,
    to: string,
    filename: string,
    caption: string
  ) => void;
  setMessagesAdminsOnly: (chatId: string, option: boolean) => boolean;
  setMyName: (name: string) => void;
  setMyStatus: (to: string) => void;
  setProfilePic: (path: string) => Promise<boolean>;
  setTheme: (theme?: string) => boolean;
  startTyping: (to: string) => void;
  stopTyping: (to: string) => void;
  takeOver: () => boolean;
  unblockContact: (messageId: string) => boolean;
  waitNewAcknowledgements: (callback: Function) => void;
  waitNewMessages: (rmCallback: boolean, callback: Function) => void;
  sendSeen: (to: string) => void;
}

declare global {
  interface Window {
    WAPI: WAPI;
  }
  var WAPI: WAPI;
}
