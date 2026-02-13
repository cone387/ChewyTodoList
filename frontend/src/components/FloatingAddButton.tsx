import React from 'react';
import { useNavigate } from 'react-router-dom';

interface FloatingAddButtonProps {
  onClick?: () => void;
  defaultProject?: string;
}

const FloatingAddButton: React.FC<FloatingAddButtonProps> = ({ onClick, defaultProject }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      const url = defaultProject ? `/create?project=${defaultProject}` : '/create';
      navigate(url);
    }
  };

  return (
    <button 
      className="fixed bottom-24 right-6 z-30 size-14 rounded-2xl bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center active:scale-95 transition-transform hover:shadow-xl"
      onClick={handleClick}
    >
      <span className="material-symbols-outlined text-[28px]">add</span>
    </button>
  );
};

export default FloatingAddButton;