/**
 * @typedef {Object} OAuthToken
 * @property {string} oauth_token
 * @property {string} oauth_token_secret
 * @property {string} [user_nsid]
 * @property {string} [username]
 * @property {string} [fullname]
 */

/**
 * @typedef {Object} Album
 * @property {string} id
 * @property {string} title
 * @property {number} photoCount
 * @property {string} primaryPhotoId
 * @property {string} thumbUrl
 */

/**
 * @typedef {Object} AlbumsPage
 * @property {number} page
 * @property {number} pages
 * @property {number} perPage
 * @property {number} total
 * @property {Album[]} items
 */

/**
 * @typedef {"Small"|"Medium"|"Large"|"Original"} SizePref
 */

/**
 * @typedef {Object} DownloadImage
 * @property {string} id
 * @property {string} [title]
 * @property {string} bestUrl
 */

/**
 * @typedef {Object} Settings
 * @property {SizePref} size
 * @property {string} downloadDir
 */

/**
 * @typedef {Object} FlickrSecrets
 * @property {string} apiKey
 * @property {string} apiSecret
 */

export const SizePrefValues = ["Small", "Medium", "Large", "Original"];
