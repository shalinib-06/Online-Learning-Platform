import { useGoogleLogin } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";

const SocialAuth = ({ label, onGoogleSuccess, onGoogleError }) => {
  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      // Pass the access_token wrapped in a similar object as credential
      onGoogleSuccess({ access_token: tokenResponse.access_token });
    },
    onError: onGoogleError,
  });

  return (
    <div className="social-auth">
      <div className="social-auth__divider">
        <span>{label}</span>
      </div>
      <div className="social-auth__google">
        <button 
          type="button" 
          className="btn-google-custom" 
          onClick={() => login()}
        >
          <FcGoogle size={24} />
          <span>Continue with Google</span>
        </button>
      </div>
    </div>
  );
};

export default SocialAuth;
