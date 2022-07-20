export class TwitterApi {
  public static GRANT_TYPE: string = "authorization_code"
  public static GRANT_TYPE_REFRESH: string = "refresh_token"
  public static CLIENT_ID: string = "MloxZFZUd21FWEJ1VHBnMkd3RHA6MTpjaQ"
  public static REDIRECT_URI: string = "https://feeds.trinity-feeds.app/logininsuccess"
  public static CODE_VERIFIER: string = "challenge"

  // public static AUTH: string = "https://twitter.com/i/oauth2/authorize?response_type=code&client_id=MloxZFZUd21FWEJ1VHBnMkd3RHA6MTpjaQ&redirect_uri=https://feeds.trinity-feeds.app/logininsuccess&scope=tweet.read%20tweet.write%20users.read%20follows.read+follows.write%20offline.access&state=state&code_challenge=challenge&code_challenge_method=plain"
  public static AUTH: string = "https://twitter.com/i/oauth2/authorize?response_type=code&client_id=MloxZFZUd21FWEJ1VHBnMkd3RHA6MTpjaQ&redirect_uri=https://feeds.trinity-feeds.app/logininsuccess&scope=tweet.read%20tweet.write%20users.read%20offline.access&state=state&code_challenge=challenge&code_challenge_method=plain"

  public static TOKEN: string = "https://api.twitter.com/2/oauth2/token"

  public static TEWWTS: string = "https://api.twitter.com/2/tweets"
  public static MEDIA: string = "https://upload.twitter.com/1.1/media/upload.json"
}