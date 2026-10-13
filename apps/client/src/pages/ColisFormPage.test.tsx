import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderAvecDonnees } from '@/test/render-avec-donnees';
import { ColisFormPage } from './ColisFormPage';

// SubmitBar renders the desktop panel and the mobile bar (CSS picks one):
// the confirm button exists twice in the DOM.
function boutonsConfirmer() {
  return screen.getAllByRole('button', { name: "Confirmer l'envoi" });
}

describe('ColisFormPage', () => {
  it('says what is missing, then unlocks once complete, priced by the recipient’s neighbourhood', async () => {
    const user = userEvent.setup();
    renderAvecDonnees(<ColisFormPage />);

    // The default address is preselected: the first missing item is the recipient.
    expect(await screen.findByText(/Il manque : nom du destinataire/)).toBeInTheDocument();
    for (const bouton of boutonsConfirmer()) expect(bouton).toBeDisabled();

    await user.type(screen.getByLabelText('Nom du destinataire'), 'Awa Sambiéni');
    await user.type(screen.getByLabelText('Son téléphone'), '0161000000');
    await waitFor(() => expect(screen.getByRole('option', { name: 'Ourbouga' })).toBeInTheDocument());
    await user.selectOptions(screen.getByLabelText('Quartier du destinataire'), 'q-ourb');
    await user.type(screen.getByLabelText('Point de repère'), 'Portail vert');

    expect(screen.getByText(/Il manque : confirmer : aucun objet interdit/)).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: /aucun objet interdit/i }));

    expect(screen.getByText('Tout est prêt.')).toBeInTheDocument();
    // Ourbouga = 1 000 FCFA, whatever the size.
    expect(screen.getAllByText(/1\s000 FCFA/).length).toBeGreaterThan(0);
    for (const bouton of boutonsConfirmer()) expect(bouton).toBeEnabled();
  });

  it('asks for the name when "Autre quartier" is picked', async () => {
    const user = userEvent.setup();
    renderAvecDonnees(<ColisFormPage />);

    await waitFor(() => expect(screen.getByRole('option', { name: 'Autre quartier' })).toBeInTheDocument());
    await user.selectOptions(screen.getByLabelText('Quartier du destinataire'), 'q-autre');

    expect(screen.getByLabelText('Nom du quartier')).toBeRequired();
  });
});
