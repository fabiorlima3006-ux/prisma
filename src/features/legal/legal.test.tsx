import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PrivacidadePage from '@/app/privacidade/page';

describe('Privacidade', () => {
  it('informa a retenção temporária do IP e os logs da hospedagem', () => {
    render(<PrivacidadePage />);
    expect(
      screen.getByText(
        'Para limitar abusos, o endereço IP é mantido temporariamente na memória do servidor e descartado na primeira requisição após 1 minuto (ou quando o servidor reinicia); a hospedagem pode registrar acessos em logs técnicos. Esses dados não são usados para identificar visitantes.',
        { normalizer: (t) => t.replace(/\s+/g, ' ').trim() },
      ),
    ).toBeInTheDocument();
  });
});
