// A component for setting up mail merges.

import React from "react";

import { serverFunctions } from "../utils/serverFunctions";
import { Button, Form, InputGroup } from "react-bootstrap";

import { EmailDraft, MergeConfig } from "../../Types";

interface MergeState {
  drafts: EmailDraft[];
  mergeConfig: MergeConfig;
  loaded: boolean;
}

class MergeWizard extends React.Component<{}, MergeState> {
  constructor(props) {
    super(props);
    this.state = {
      drafts: undefined,
      mergeConfig: undefined,
      loaded: false,
    };
  }

  componentDidMount() {
    Promise.all([
      serverFunctions.GetDefaultMergeConfig(),
      serverFunctions.GetGmailDrafts(),
    ]).then(([mergeConfig, drafts]) => {
      this.setState({ mergeConfig, drafts, loaded: true });
    });
  }

  render() {
    // Layout: A select box for the drafts, a field for sender name, then two buttons at the bottom: Send Test Email, and Send All Emails.
    return (
      <React.Fragment>
        {/*<h1>F3 Mail Merge</h1>*/}
        <Form>
          <Form.Group>
            <Form.Label>Sender Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Sender Name"
              disabled={!this.state.loaded}
              value={this.state.mergeConfig.senderName}
              onChange={(e) => {
                this.setState({
                  mergeConfig: {
                    ...this.state.mergeConfig,
                    senderName: e.target.value,
                  },
                });
              }}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Email Template</Form.Label>
            <Form.Control
              as="select"
              disabled={!this.state.loaded}
              value={this.state.mergeConfig.draftId}
              onChange={(e) => {
                this.setState({
                  mergeConfig: {
                    ...this.state.mergeConfig,
                    draftId: e.target.value,
                  },
                });
              }}
            >
              {this.state.drafts.map((draft) => (
                <option value={draft.id}>{draft.subject}</option>
              ))}
            </Form.Control>
          </Form.Group>
        </Form>
      </React.Fragment>
    );
  }
}

export default MergeWizard;
