import { fireEvent, render, waitFor } from '@testing-library/react';
import React from 'react';
import { mocked } from 'ts-jest/utils';

import { API } from '../../../../../api';
import { AppCtx } from '../../../../../context/AppCtx';
import DeleteOrg from './DeleteOrg';
jest.mock('../../../../../api');

jest.mock('../../../../../utils/authorizer', () => ({
  check: () => {
    return true;
  },
}));

const mockCtx = {
  user: { alias: 'test', email: 'test@test.com' },
  prefs: {
    controlPanel: { selectedOrg: 'orgTest' },
    search: { limit: 60 },
    theme: {
      configured: 'light',
      automatic: false,
    },
  },
};

const mockDispatch = jest.fn();
const mockOnAuthError = jest.fn();

const defaultProps = {
  onAuthError: mockOnAuthError,
  organization: {
    name: 'orgTest',
    displayName: 'Test',
    description: 'Lorem ipsum...',
    homeUrl: 'https://test.org',
    logoImageId: 'f0552fa9-e03d-47cf-90cd-b9b0b6ba19e2',
  },
};

describe('DeleteOrg', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('creates snapshot', () => {
    const result = render(
      <AppCtx.Provider value={{ ctx: mockCtx, dispatch: mockDispatch }}>
        <DeleteOrg {...defaultProps} />
      </AppCtx.Provider>
    );
    expect(result.asFragment()).toMatchSnapshot();
  });

  describe('Render', () => {
    it('renders component', () => {
      const { getByTestId } = render(
        <AppCtx.Provider value={{ ctx: mockCtx, dispatch: mockDispatch }}>
          <DeleteOrg {...defaultProps} />
        </AppCtx.Provider>
      );

      expect(getByTestId('deleteModalOrgBtn')).toBeInTheDocument();
    });

    it('opens modal', () => {
      const { getByTestId, getByText } = render(
        <AppCtx.Provider value={{ ctx: mockCtx, dispatch: mockDispatch }}>
          <DeleteOrg {...defaultProps} />
        </AppCtx.Provider>
      );

      const btn = getByTestId('deleteModalOrgBtn');
      fireEvent.click(btn);

      expect(getByTestId('deleteOrgBtn')).toBeInTheDocument();
      expect(getByText('Cancel')).toBeInTheDocument();
    });

    it('closes modal', () => {
      const { getByTestId, getByText, queryByText } = render(
        <AppCtx.Provider value={{ ctx: mockCtx, dispatch: mockDispatch }}>
          <DeleteOrg {...defaultProps} />
        </AppCtx.Provider>
      );

      const btn = getByTestId('deleteModalOrgBtn');
      fireEvent.click(btn);

      expect(getByTestId('deleteOrgBtn')).toBeInTheDocument();
      const cancelBtn = getByText('Cancel');
      fireEvent.click(cancelBtn);

      waitFor(() => {
        expect(queryByText('Cancel')).toBeNull();
      });
    });

    it('calls delete org', async () => {
      mocked(API).deleteOrganization.mockResolvedValue(null);

      const { getByTestId, getByText } = render(
        <AppCtx.Provider value={{ ctx: mockCtx, dispatch: mockDispatch }}>
          <DeleteOrg {...defaultProps} />
        </AppCtx.Provider>
      );

      const btn = getByTestId('deleteModalOrgBtn');
      fireEvent.click(btn);

      waitFor(() => {
        const txt = getByTestId('confirmationText');
        expect(txt).toHaveTextContent('Please type orgTest to confirm:');
      });

      const deleteBtn = getByTestId('deleteOrgBtn');
      expect(deleteBtn).toBeDisabled();

      const input = getByTestId('orgNameInput');
      fireEvent.change(input, { target: { value: 'orgTest' } });

      waitFor(() => {
        expect(deleteBtn).toBeEnabled();
      });
      fireEvent.click(deleteBtn);

      expect(getByText('Deleting...')).toBeInTheDocument();

      await waitFor(() => {
        expect(API.deleteOrganization).toHaveBeenCalledTimes(1);
        expect(API.deleteOrganization).toHaveBeenCalledWith('orgTest');
      });
      // expect(mockDispatch).toHaveBeenCalledTimes(1);
      // expect(mockDispatch).toHaveBeenCalledWith({ type: 'unselectOrg' });
    });
  });
});
