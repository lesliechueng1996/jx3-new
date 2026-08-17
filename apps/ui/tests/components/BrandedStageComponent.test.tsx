import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  BrandedBlurTextComponent,
  BrandedCountUpComponent,
  BrandedGlassCardComponent,
  BrandedMarkComponent,
  BrandedStageComponent,
} from '@/components/BrandedStageComponent';

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe('BrandedStageComponent', () => {
  it('renders children for each mood', () => {
    mockMatchMedia(false);
    const { rerender } = render(
      <BrandedStageComponent mood="login">
        <p>内容</p>
      </BrandedStageComponent>,
    );
    expect(screen.getByText('内容')).toBeInTheDocument();

    rerender(
      <BrandedStageComponent mood="forbidden">
        <p>禁止</p>
      </BrandedStageComponent>,
    );
    expect(screen.getByText('禁止')).toBeInTheDocument();

    rerender(
      <BrandedStageComponent mood="error">
        <p>出错</p>
      </BrandedStageComponent>,
    );
    expect(screen.getByText('出错')).toBeInTheDocument();

    rerender(
      <BrandedStageComponent mood="not-found">
        <p>没有</p>
      </BrandedStageComponent>,
    );
    expect(screen.getByText('没有')).toBeInTheDocument();
  });

  it('renders static text when reduced motion is preferred', () => {
    mockMatchMedia(true);
    render(
      <>
        <BrandedMarkComponent />
        <BrandedGlassCardComponent>卡片</BrandedGlassCardComponent>
        <BrandedBlurTextComponent text="静态标题" />
        <BrandedCountUpComponent to={404} />
      </>,
    );
    expect(screen.getByText('卡片')).toBeInTheDocument();
    expect(screen.getByText('静态标题')).toBeInTheDocument();
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('animates text when motion is allowed', () => {
    mockMatchMedia(false);
    render(
      <>
        <BrandedBlurTextComponent
          text="动画标题"
          animateBy="words"
          delay={10}
        />
        <BrandedCountUpComponent to={500} duration={0.2} />
      </>,
    );
    expect(screen.getByText('动画标题')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
  });
});
