/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aboutContent from "../aboutContent.js";
import type * as clientInsights from "../clientInsights.js";
import type * as crons from "../crons.js";
import type * as dietLogs from "../dietLogs.js";
import type * as dietPlans from "../dietPlans.js";
import type * as files from "../files.js";
import type * as gallery from "../gallery.js";
import type * as seed from "../seed.js";
import type * as storageCleanup from "../storageCleanup.js";
import type * as successStories from "../successStories.js";
import type * as todos from "../todos.js";
import type * as trainingPlans from "../trainingPlans.js";
import type * as transformationImages from "../transformationImages.js";
import type * as users from "../users.js";
import type * as weightLogs from "../weightLogs.js";
import type * as workoutSessions from "../workoutSessions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  aboutContent: typeof aboutContent;
  clientInsights: typeof clientInsights;
  crons: typeof crons;
  dietLogs: typeof dietLogs;
  dietPlans: typeof dietPlans;
  files: typeof files;
  gallery: typeof gallery;
  seed: typeof seed;
  storageCleanup: typeof storageCleanup;
  successStories: typeof successStories;
  todos: typeof todos;
  trainingPlans: typeof trainingPlans;
  transformationImages: typeof transformationImages;
  users: typeof users;
  weightLogs: typeof weightLogs;
  workoutSessions: typeof workoutSessions;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
