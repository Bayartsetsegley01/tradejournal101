import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { query } from '../config/database.js';

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    if (!profile.emails || !profile.emails[0]) {
      console.error('Google OAuth: no email in profile');
      return done(new Error('Google профайлд имэйл олдсонгүй'));
    }
    const email = profile.emails[0].value;
    const googleId = profile.id;
    const name = profile.displayName;
    const picture = profile.photos[0]?.value;

    let result = await query('SELECT * FROM users WHERE google_id=$1', [googleId]);
    let user;

    if (result.rows[0]) {
      user = result.rows[0];
      await query(
        'UPDATE users SET avatar_url=$1,last_login_at=NOW(),email_verified=true WHERE id=$2',
        [picture || user.avatar_url, user.id]
      );
    } else {
      result = await query('SELECT * FROM users WHERE email=$1', [email]);
      if (result.rows[0]) {
        user = result.rows[0];
        await query(
          'UPDATE users SET google_id=$1,avatar_url=$2,auth_provider=$3,email_verified=true,last_login_at=NOW() WHERE id=$4',
          [googleId, picture || null, user.auth_provider === 'email' ? 'both' : 'google', user.id]
        );
      } else {
        const newUser = await query(
          `INSERT INTO users (name,email,google_id,avatar_url,auth_provider,role,email_verified,last_login_at)
           VALUES ($1,$2,$3,$4,'google','user',true,NOW())
           RETURNING id,name,email,role,avatar_url,onboarding_completed`,
          [name || email.split('@')[0], email, googleId, picture || null]
        );
        user = newUser.rows[0];
      }
    }

    return done(null, user);
  } catch (err) {
    console.error('Google OAuth strategy error:', err);
    return done(err);
  }
}));

export default passport;
