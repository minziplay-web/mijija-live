"use client";

import { collection, collectionGroup, doc } from "firebase/firestore";

import { getFirebaseServices } from "@/lib/firebase/client";

export function usersCollection() {
  const { db } = getFirebaseServices();
  return db ? collection(db, "users") : null;
}

export function userDoc(userId: string) {
  const { db } = getFirebaseServices();
  return db ? doc(db, "users", userId) : null;
}

export function questionsCollection() {
  const { db } = getFirebaseServices();
  return db ? collection(db, "questions") : null;
}

export function dailyRunsCollection() {
  const { db } = getFirebaseServices();
  return db ? collection(db, "dailyRuns") : null;
}

export function dailyRunDoc(dateKey: string) {
  const { db } = getFirebaseServices();
  return db ? doc(db, "dailyRuns", dateKey) : null;
}

export function dailyAnswersCollection() {
  const { db } = getFirebaseServices();
  return db ? collection(db, "dailyAnswers") : null;
}

export function dailyAnswerDoc(answerId: string) {
  const { db } = getFirebaseServices();
  return db ? doc(db, "dailyAnswers", answerId) : null;
}

export function dailyPrivateAnswersCollection() {
  const { db } = getFirebaseServices();
  return db ? collection(db, "dailyPrivateAnswers") : null;
}

export function dailyPrivateAnswerDoc(answerId: string) {
  const { db } = getFirebaseServices();
  return db ? doc(db, "dailyPrivateAnswers", answerId) : null;
}

export function dailyFirstAnswerDoc(docId: string) {
  const { db } = getFirebaseServices();
  return db ? doc(db, "dailyFirstAnswers", docId) : null;
}

export function dailyFirstAnswersCollection() {
  const { db } = getFirebaseServices();
  return db ? collection(db, "dailyFirstAnswers") : null;
}

export function dailyMemeVotesCollection() {
  const { db } = getFirebaseServices();
  return db ? collection(db, "dailyMemeVotes") : null;
}

export function dailyMemeVoteDoc(docId: string) {
  const { db } = getFirebaseServices();
  return db ? doc(db, "dailyMemeVotes", docId) : null;
}

export function liveSessionsCollection() {
  const { db } = getFirebaseServices();
  return db ? collection(db, "liveSessions") : null;
}

export function liveSessionDoc(sessionId: string) {
  const { db } = getFirebaseServices();
  return db ? doc(db, "liveSessions", sessionId) : null;
}

export function liveLobbyCodesCollection() {
  const { db } = getFirebaseServices();
  return db ? collection(db, "liveLobbyCodes") : null;
}

export function liveLobbyCodeDoc(code: string) {
  const { db } = getFirebaseServices();
  return db ? doc(db, "liveLobbyCodes", code) : null;
}

export function liveParticipantsCollection(sessionId: string) {
  const { db } = getFirebaseServices();
  return db ? collection(db, "liveSessions", sessionId, "participants") : null;
}

export function liveParticipantsGroup() {
  const { db } = getFirebaseServices();
  return db ? collectionGroup(db, "participants") : null;
}

export function liveParticipantDoc(sessionId: string, userId: string) {
  const { db } = getFirebaseServices();
  return db ? doc(db, "liveSessions", sessionId, "participants", userId) : null;
}

export function liveAnswersCollection() {
  const { db } = getFirebaseServices();
  return db ? collection(db, "liveAnswers") : null;
}

export function liveAnswerDoc(answerId: string) {
  const { db } = getFirebaseServices();
  return db ? doc(db, "liveAnswers", answerId) : null;
}

export function livePrivateAnswersCollection() {
  const { db } = getFirebaseServices();
  return db ? collection(db, "livePrivateAnswers") : null;
}

export function livePrivateAnswerDoc(answerId: string) {
  const { db } = getFirebaseServices();
  return db ? doc(db, "livePrivateAnswers", answerId) : null;
}

export function userStatsCollection() {
  const { db } = getFirebaseServices();
  return db ? collection(db, "userStats") : null;
}

export function userStatsDoc(userId: string) {
  const { db } = getFirebaseServices();
  return db ? doc(db, "userStats", userId) : null;
}

export function appConfigDoc() {
  const { db } = getFirebaseServices();
  return db ? doc(db, "appConfig", "main") : null;
}

export function adminErrorLogsCollection() {
  const { db } = getFirebaseServices();
  return db ? collection(db, "adminErrorLogs") : null;
}
