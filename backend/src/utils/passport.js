import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { query } from '../db/index.js';

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    const googleId = profile.id;
    const name = profile.displayName;
    const picture = profile.photos[0]?.value;

    let result = await query('SELECT * FROM users WHERE google_id = $1', [googleId]);
    let user;

    if (result.rows.length > 0) {
      user = result.rows[0];
      await query(
        'UPDATE users SET avatar_url = $1, last_login_at = CURRENT_TIMESTAMP WHERE id = $2',
        [picture || user.avatar_url, user.id]
      );
    } else {
      result = await query('SELECT * FROM users WHERE email = $1', [email]);
      if (result.rows.length > 0) {
        user = result.rows[0];
        await query(
          'UPDATE users SET google_id = $1, avatar_url = $2, auth_provider = $3, last_login_at = CURRENT_TIMESTAMP WHERE id = $4',
          [googleId, picture || null, user.auth_provider === 'email' ? 'both' : 'google', user.id]
        );
        user.avatar_url = picture;
      } else {
        const newUser = await query(
          `INSERT INTO users (name, email, google_id, avatar_url, auth_provider, role, last_login_at)
           VALUES ($1, $2, $3, $4, 'google', 'user', CURRENT_TIMESTAMP)
           RETURNING id, name, email, role, avatar_url`,
          [name || email.split('@')[0], email, googleId, picture || null]
        );
        user = newUser.rows[0];
      }
    }

    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

export default passport;
