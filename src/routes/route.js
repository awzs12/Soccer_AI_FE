import { useNavigate } from 'react-router-dom';

export function useRedirectToCurrentPage() {
  const navigate = useNavigate();

  const redirectToCurrentPage = () => {
    const currentPath = window.location.pathname;
    navigate(currentPath);
  };

  return redirectToCurrentPage;
}