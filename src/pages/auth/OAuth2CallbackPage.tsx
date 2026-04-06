import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../../store/authSlice";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";

function OAuth2CallbackPage() {
  const { toast, showToast, closeToast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const hasFetched = useRef(false);

  useEffect(() => {
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
            token: data.token,
            role: data.role,
          })
        );
        const dest = data.role === "ADMIN" ? "/admin" : "/home";
        navigate(dest, { replace: true });
      })
      .catch(() => {
        showToast("로그인에 실패했습니다. 다시 시도해주세요.", "error");
        setTimeout(() => navigate("/login", { replace: true }), 500);
      });
  }, []);

  return <>
    {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    <div style={{ color: "white", textAlign: "center", marginTop: 80 }}>로그인 처리 중...</div>
  </>;
}

export default OAuth2CallbackPage;
