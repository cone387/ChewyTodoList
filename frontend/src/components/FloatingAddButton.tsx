import React from 'react';
import { useNavigate } from 'react-router-dom';

interface FloatingAddButtonProps {
  onClick?: () => void;
}

const FloatingAddButton: React.FC<FloatingAddButtonProps> = ({ onClick }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate('/create');
    }
  };

  return (
    <button 
      className="fixed bottom-20 right-6 z-30 size-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform hover:shadow-xl"
      onClick={handleClick}
    >
      <span className="material-symbols-outlined text-[32px]">add</span>
    </button>
  );
};

export default FloatingAddButton;