import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../../store/authSlice";

// 기존 소셜 유저가 OAuth2 로그인 후 리다이렉트되는 페이지
function OAuth2CallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const hasFetched = useRef(false);

  useEffect(() => {
    // React 18 Strict Mode 이중 실행 방지
    if (hasFetched.current) return;
    hasFetched.current = true;

    const token = searchParams.get("token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    fetch(`/api/auth/social/session?token=${token}`)
      .then((res) => {
        if (!res.ok) throw new Error("세션 오류");
        return res.json();
      })
      .then((data) => {
        dispatch(
          loginSuccess({
            email: data.email,
            name: data.name,
            createDate: data.createdAt,
            imgUrl: data.imgUrl || undefined,
          })
        );
        navigate("/home", { replace: true });
      })
      .catch(() => {
        alert("로그인에 실패했습니다. 다시 시도해주세요.");
        navigate("/login", { replace: true });
      });
  }, []);

  return <div style={{ color: "white", textAlign: "center", marginTop: 80 }}>로그인 처리 중...</div>;
}

export default OAuth2CallbackPage;
