import axiosClient from './axiosClient';

const userApi = {
  getDailyRecommendation: (casteId, gender) =>
    axiosClient.get(`/user/getDailyShuffledUsersByCaste/${casteId}/${gender}`),

  getNewConnections: (casteId, gender) =>
    axiosClient.get(`/user/getTop30NewUsers/${casteId}/${gender}`),

  getNearYouProfiles: (casteId, gender, location) =>
    axiosClient.get(`/user/getUserDetailByCasteIdAndLocation/${casteId}/${gender}/${location}`),

  getProfileDetails: (userId) =>
    axiosClient.get(`/user/getUserByUserId/${userId}`),

  getProfileDetailByUserId: (userId, requesterId) =>
    axiosClient.get(`/user/getProfileDetailByUserId/${userId}`, {
      params: requesterId ? { requesterId } : undefined,
    }),

  getUserGalleryImages: (userId) =>
    axiosClient.get(`/gallery/getAllImagesByUserId/${userId}`),

  changeGalleryImageActiveStatusByImageId: (galleryId) =>
    axiosClient.put(`/gallery/changeImageActiveStatus/${galleryId}`),

  userChatList: (userId) =>
    axiosClient.get(`/conversation/chatlist/${userId}`),

  getRandomUsers: (gender, casteId) =>
    axiosClient.get(`/user/getTenShuffledUsers/${gender}/${casteId}`),

  filterUsers: (request) =>
    axiosClient.post(`/user/filterUsers`, request),

  userConnectionCount: (userId) =>
    axiosClient.get(`/user/getUserConnectionCounts/${userId}`),

  getFollowingList: (userId) =>
    axiosClient.get(`/userConnection/following/${userId}`),

  getFollowersList: (userId) =>
    axiosClient.get(`/userConnection/followers/${userId}`),

  unfollowOrRemoveUser: (followerId, followingId) =>
    axiosClient.post(`/userConnection/unfollow/${followerId}/${followingId}`),

  login: (request) =>
    axiosClient.post(`/user/login`, request),

  getConversationData: (conversationId) =>
    axiosClient.get(`/chat/conversation/${conversationId}`),

  updateUserConversation: (request) =>
    axiosClient.post(`/chat/send`, request),

  markAsRead: (conversationId, senderId) =>
    axiosClient.post(`/chat/mark-as-read/${conversationId}/${senderId}`),

  updateProfile: (request) =>
    axiosClient.post(`/user-details/update-personal-info`, request),

  updateAstroInfo: (request) =>
    axiosClient.post(`/user-details/update-astrology-info`, request),

  updateEducationInfo: (request) =>
    axiosClient.post(`/user-details/update-education-info`, request),

  updateFamilyInfo: (request) =>
    axiosClient.post(`/user-details/update-family-info`, request),

  getAllCaste: () =>
    axiosClient.get(`/caste/getAllActiveCaste`),

  createUser: (request) =>
    axiosClient.post(`/user/createUser`, request),

  getAllCasteProfilesByGender: (casteId, gender) =>
    axiosClient.get(`/user/getUserDetailByCasteId/${casteId}/${gender}`),

  getReceivedMailbox: (userId) =>
    axiosClient.get(`/mailbox/received/${userId}`),

  getSentMailbox: (userId) =>
    axiosClient.get(`/mailbox/sent/${userId}`),

  getShortlistedMailbox: (userId) =>
    axiosClient.get(`/mailbox/shortlisted/${userId}`),

  getWhoShortlistedMe: (encodedId, page = 0, size = 10) =>
    axiosClient.get(`/mailbox/whoShortlistedMe/${encodedId}`, {
      params: { page, size },
    }),

  createServiceRequest: (encodedUserId, requestType, note, targetUserId) =>
    axiosClient.post(`/service-request/create/${encodedUserId}`, { requestType, note, targetUserId }),

  getMyServiceRequests: (encodedUserId, page = 0, size = 10) =>
    axiosClient.get(`/service-request/my/${encodedUserId}`, {
      params: { page, size },
    }),

  // ==== Family Login ====
  createFamilyLogin: (encodedUserId, body) =>
    axiosClient.post(`/family-login/create/${encodedUserId}`, body),

  getMyFamilyLogins: (encodedUserId) =>
    axiosClient.get(`/family-login/mine/${encodedUserId}`),

  revokeFamilyLogin: (encodedUserId, familyLoginId) =>
    axiosClient.delete(`/family-login/${encodedUserId}/${familyLoginId}`),

  deleteHoroscopeByUserId: (encodedUserId) =>
    axiosClient.delete(`/gallery/deleteHoroscope/${encodedUserId}`),

  deleteAccount: (encodedUserId) =>
    axiosClient.delete(`/user/deleteAccount/${encodedUserId}`),

  getMyBlockedUsers: (encodedUserId) =>
    axiosClient.get(`/block/getMyBlocked/${encodedUserId}`),

  getPendingReceivedProfiles: (userId) =>
    axiosClient.get(`/mailbox/pending-received/${userId}`),

  getAcceptedReceivedProfiles: (userId) =>
    axiosClient.get(`/mailbox/accepted-received/${userId}`),

  getRejectedReceivedProfiles: (userId) =>
    axiosClient.get(`/mailbox/rejected/${userId}`),

  updateInterestRequestStatus: (interestId, approvalStatus) =>
    axiosClient.put(`/mailbox/updateInterestRequestStatus/${interestId}/${approvalStatus}`),

  deleteInterestRequest: (interestId) =>
    axiosClient.delete(`/mailbox/deleteInterestRequest/${interestId}`),

  deleteShortlistedProfile: (shortlistedId) =>
    axiosClient.delete(`/mailbox/deleteShortlistedProfile/${shortlistedId}`),

  getRestrictedRequestsById: (userId) =>
    axiosClient.get(`/restrictedFieldRequest/getRestrictedRequestsById/${userId}`),

  getRestrictedRequestsToId: (userId) =>
    axiosClient.get(`/restrictedFieldRequest/getRestrictedRequestsToId/${userId}`),

  createUserLike: (request) =>
    axiosClient.post(`/userLikes/createUserLike`, request),

  checkIfLiked: (likedBy, likedTo) =>
    axiosClient.get(`/userLikes/checkIfLiked/${likedBy}/${likedTo}`),

  deleteLike: (likedBy, likedTo) =>
    axiosClient.delete(`/userLikes/deleteLike/${likedBy}/${likedTo}`),

  sendInterestRequest: (senderId, receiverId) =>
    axiosClient.post(`/interestRequest/sendInterestRequest/${senderId}/${receiverId}`),

  checkInterestStatus: (senderId, receiverId) =>
    axiosClient.get(`/interestRequest/checkInterestStatus/${senderId}/${receiverId}`),

  getAllNotifications: (userId) =>
    axiosClient.get(`/notifications/getAllNotifications/${userId}`),

  getUnreadNotificationCount: (userId) =>
    axiosClient.get(`/notifications/getUnreadNotificationCount/${userId}`),

  //Delete all notification by UserId
  deleteAllNotificationsByReceiverId: (receiverId) =>
    axiosClient.delete(`/notifications/deleteAllNotificationsByReceiverId/${receiverId}`),

  //Mark all notification as read by UserId
  markAllAsReadByReceiverId: (receiverId) =>
    axiosClient.post(`/notifications/markAllAsReadByReceiverId/${receiverId}`),

  deleteNotification: (notificationId) =>
    axiosClient.delete(`/notifications/deleteNotificationById/${notificationId}`),

  getConversationStatusById: (conversationId) =>
    axiosClient.get(`/conversation/getConversationStatus/${conversationId}`),

  getAllHappyStoriesByIsActive: () =>
    axiosClient.get(`/happyStory/getAllHappyStoriesByIsActive/Y`),

  reportUser: (request) =>
    axiosClient.post(`/userReport/reportUser`, request),

  blockUser: (request) =>
    axiosClient.post(`/block/blockUser`, request),

  checkBlockedByBlockedId: (userId1, userId2) =>
    axiosClient.get(`/block/checkBlockedByBlockedId/${userId1}/${userId2}`),

  lastSeen: (userId) =>
    axiosClient.put(`/user/lastseen/${userId}`),

  getUserOnlineStatus: (userId) =>
    axiosClient.get(`/user/getUserOnlineStatus/${userId}`),

  deleteBlockedUser: (id) =>
    axiosClient.delete(`/block/deleteBlockedUser/${id}`),

  insertShortlistedProfile: (request) =>
    axiosClient.post(`/mailbox/insertShortlistedProfile`, request),

  checkIfShortlisted: (encodedId, userId) =>
    axiosClient.get(`/mailbox/checkShortlisted/${encodedId}/${userId}`),

  deleteShortlistedProfileByUsers: (encodedId, userId) =>
    axiosClient.delete(`/mailbox/deleteShortlistedProfileByUsers/${encodedId}/${userId}`),

  getProfileCompletion: (userId) =>
    axiosClient.get(`/user-details/getProfileCompletion/${userId}`),

  getUserPaidStatus: (userId) =>
    axiosClient.get(`/user/getUserPaidStatus/${userId}`),

  viewedProfile: (encodedId, userId) =>
    axiosClient.post(`/view/viewedProfile/${encodedId}/${userId}`),

  getProfileViewers: (userId) =>
    axiosClient.get(`/view/getProfileViewers/${userId}`),

  getAcceptedInterestRequests: (encodedId) =>
    axiosClient.get(`/interestRequest/getAcceptedInterestRequests/${encodedId}`),

  createHiddenField: (userId, fieldName) =>
    axiosClient.post(`/hiddenFields/createHiddenField/${userId}/${fieldName}`),

  deleteHiddenField: (hiddenFieldId) =>
    axiosClient.delete(`/hiddenFields/deleteHiddenField/${hiddenFieldId}`),

  getHiddenFieldsByUserId: (userId) =>
    axiosClient.get(`/hiddenFields/getHiddenFieldsByUserId/${userId}`),

  sendOtp: (mobileNumber) =>
    axiosClient.post(`/user/sendOtp/${mobileNumber}`),

  verifyOtp: (request) =>
    axiosClient.post(`/user/verifyOtp`, request),

  changePin: (request) =>
    axiosClient.post(`/user/changePin`, request),

  // ===== Email-based auth =====
  sendAuthOtp: (body) =>
    axiosClient.post(`/auth/send-otp`, body),

  verifyAuthOtp: (body) =>
    axiosClient.post(`/auth/verify-otp`, body),

  forgotPassword: (body) =>
    axiosClient.post(`/auth/forgot-password`, body),

  resetPasswordWithToken: (body) =>
    axiosClient.post(`/auth/reset-password`, body),

  resubmitProfile: (encodedUserId) =>
    axiosClient.post(`/user/resubmit-profile/${encodedUserId}`),

  sendRestrictedFieldRequest: (requestedBy, requestedTo, fieldType) =>
    axiosClient.post(`/restrictedFieldRequest/sendRestrictedFieldRequest/${requestedBy}/${requestedTo}/${fieldType}`),

  deleteRequest: (requestedBy, requestedTo, fieldType) =>
    axiosClient.delete(`/restrictedFieldRequest/deleteRequest/${requestedBy}/${requestedTo}/${fieldType}`),

  getRequestsTo: (requestBy, requestTo) =>
    axiosClient.get(`/restrictedFieldRequest/getRequestsTo/${requestBy}/${requestTo}`),

  updateAboutByUserId: (requestBody) =>
    axiosClient.post(`/user-details/updateAboutByUserId`, requestBody),

  getAllActivePlans: () =>
    axiosClient.get(`/subscriptionPlans/getAllActivePlans`),

  getAllActivePremiumFeatures: () =>
    axiosClient.get(`/premiumFeatures/getAllActiveFeatures`),

  getProfileDetailWithIntractionStatus: (viewedUser, profileUserId) =>
    axiosClient.get(`/user/getProfileDetailWithIntractionStatus/${viewedUser}/${profileUserId}`),

  // userApi.js
  updateProfileImage: (formData) => {
    return axiosClient.post('/user/updateProfileImage', formData, {
      headers: {
        // DO NOT set Content-Type manually, Axios will set boundary
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  uploadGalleryImage: (formData) => {
    return axiosClient.post('/gallery/uploadGalleryImage', formData, {
      headers: {
        // DO NOT set Content-Type manually, Axios will set boundary
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  uploadScreenshot: (formData) => {
    return axiosClient.post('/paymentrequest/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  getPaymentRequestsByUser: (encodedUserId) => {
    return axiosClient.get(`/paymentrequest/getPaymentRequestsByUser/${encodedUserId}`);
  },

  uploadHoroscopeImage: (formData) => {
    return axiosClient.post('/gallery/uploadHoroscopeImage', formData, {
      headers: {
        // DO NOT set Content-Type manually, Axios will set boundary
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // F8 — Salary / Income Verified Badge
  uploadIncomeDocument: (encodedUserId, formData) => {
    return axiosClient.post(`/income-verification/upload/${encodedUserId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getIncomeVerificationStatus: (encodedUserId) =>
    axiosClient.get(`/income-verification/status/${encodedUserId}`),

  // Education Verified Badge
  uploadEducationDocument: (encodedUserId, formData) => {
    return axiosClient.post(`/education-verification/upload/${encodedUserId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getEducationVerificationStatus: (encodedUserId) =>
    axiosClient.get(`/education-verification/status/${encodedUserId}`),

  // Government ID Verified Badge
  uploadIdDocument: (encodedUserId, formData) => {
    return axiosClient.post(`/id-verification/upload/${encodedUserId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getIdVerificationStatus: (encodedUserId) =>
    axiosClient.get(`/id-verification/status/${encodedUserId}`),
  saveDeviceInfo: (requestBody) => {
    return axiosClient.post(`/pushNotification/saveDeviceInfo`, requestBody);
  },
  deleteDevice: (requestBody) => {
    return axiosClient.delete(`/pushNotification/deleteDevice`, { data: requestBody })
  },
  updatePushToken: (requestBody) => {
    return axiosClient.post(`/pushNotification/updateToken`, requestBody)
  },
  createOrder: (amount) => {
    return axiosClient.post(`/payments/createOrder/${amount}`)
  },
  getKeyValueByKey: (key) => {
    return axiosClient.get(`/keyValue/getKeyValueByKey/${key}`)
  },
  getProfileDetailByMemberId: (memberId, gender, casteId) => {
    return axiosClient.get(`/user/getProfileDetailByMemberId/${memberId}/${gender}/${casteId}`)
  },
  getActiveUserSubscriptionByUserId: (userId) => {
    return axiosClient.get(`/userSubscriptions/getActiveUserSubscriptionByUserId/${userId}`)
  },
  updateSendRequestCount: (userId, subscriptionId, featureId) => {
    return axiosClient.post(`/userFeatureUsage/updateUsedCount/${userId}/${subscriptionId}/${featureId}`)
  },
  getAllKeyValues: () => {
    return axiosClient.get(`/keyValue/getAllKeyValues`)
  },
  getAllUserSavedSearches: (userId) => {
    return axiosClient.get(`/savedSearches/getUserSavedSearches/${userId}`)
  },
  inActiveSavedSearch: (userId) => {
    return axiosClient.put(`/savedSearches/inActiveSavedSearch/${userId}`)
  },
  createOrUpdateSavedSearch: (requestBody) => {
    return axiosClient.post(`/savedSearches/createOrUpdateSavedSearch`, requestBody)
  },
  starMatching: (requestBody) => {
    return axiosClient.post(`/matching/porutham`, requestBody)
  }

};

export default userApi;
