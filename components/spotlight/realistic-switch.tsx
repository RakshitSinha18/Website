"use client"

interface RealisticSwitchProps {
  isOn: boolean;
  onToggle: () => void;
  orientation?: 'horizontal' | 'vertical';
}

export function RealisticSwitch({ isOn, onToggle, orientation = 'horizontal' }: RealisticSwitchProps) {
  const switchClasses = `switch ${orientation === 'vertical' ? 'switch--vertical' : ''}`;
  const containerClasses = `switch-container ${!isOn ? 'switch-container--dark' : ''}`;

  return (
    <div className={containerClasses}>
      <label>
        <span className={switchClasses}>
          <input
            className="switch__input"
            type="checkbox"
            role="switch"
            checked={isOn}
            onChange={onToggle}
          />
          <span className="switch__surface">
            <span className="switch__surface-glare"></span>
          </span>
          <span className="switch__inner-shadow"></span>
          <span className="switch__inner">
            <span className="switch__inner-glare"></span>
          </span>
          <span className="switch__rocker-shadow"></span>
          <span className="switch__rocker" />
          <span className="switch__light">
            <span className="switch__light-inner"></span>
          </span>
        </span>
      </label>
    </div>
  );
}
