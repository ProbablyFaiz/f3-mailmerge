// A component for setting up mail merges.

import React from "react";

import { serverFunctions } from "../utils/serverFunctions";
import {
  Form,
  ButtonGroup,
  Button,
  Alert,
  Row,
  Col,
  Spinner,
} from "react-bootstrap";
import { ArrowClockwise } from "react-bootstrap-icons";

import { EmailDraft, MergeConfig, MergeHints } from "../../Types";

interface MergeState {
  drafts: EmailDraft[];
  mergeConfig: MergeConfig;
  mergeHints: MergeHints;
  loaded: boolean;
  snackbar: {
    variant: "success" | "danger";
    message: string;
  };
}

class MergeWizard extends React.Component<{}, MergeState> {
  constructor(props) {
    super(props);
    this.state = {
      drafts: undefined,
      mergeConfig: undefined,
      mergeHints: undefined,
      snackbar: undefined,
      loaded: false,
    };
  }

  componentDidMount() {
    Promise.all([
      serverFunctions.GetDefaultMergeConfig(),
      serverFunctions.GetGmailDrafts(),
    ]).then(([mergeConfig, drafts]) => {
      if (mergeConfig.draftId == undefined && drafts.length > 0) {
        mergeConfig.draftId = drafts[0].id;
      }
      this.setState({ mergeConfig, drafts, loaded: true });
    });
    this.refreshMergeHints();
  }

  refreshMergeHints = () => {
    serverFunctions.GetMergeHints().then((mergeHints) => {
      const stateUpdate = { mergeHints };
      if (mergeHints?.missingKeys) {
        stateUpdate["snackbar"] = {
          variant: "danger",
          message: `Email template has keys that are not in the spreadsheet: ${mergeHints.missingKeys.join(
            ", "
          )}`,
        };
      }
      this.setState(stateUpdate);
    });
  };

  refreshDrafts = () => {
    this.setState({ loaded: false });
    serverFunctions
      .GetGmailDrafts()
      .then((drafts) => {
        this.setState({ drafts });
      })
      .catch(() => {
        this.setState({
          snackbar: {
            variant: "danger",
            message: "Failed to refresh drafts.",
          },
        });
      })
      .finally(() => {
        this.setState({ loaded: true });
      });
  };

  onSendTestEmailClick = () => {
    this.setState({ loaded: false });
    serverFunctions
      .SendTestEmail(this.state.mergeConfig)
      .then(() => {
        this.setState({
          snackbar: {
            variant: "success",
            message: "Test email sent successfully!",
          },
        });
      })
      .catch(() => {
        this.setState({
          snackbar: {
            variant: "danger",
            message: "Test email failed to send.",
          },
        });
      })
      .finally(() => {
        this.setState({ loaded: true });
      });
  };

  onRunMailMergeClick = () => {
    this.setState({ loaded: false });
    serverFunctions
      .RunMailMerge(this.state.mergeConfig)
      .then(() => {
        this.setState({
          snackbar: {
            variant: "success",
            message: "Mail merge complete!",
          },
        });
      })
      .catch(() => {
        this.setState({
          snackbar: {
            variant: "danger",
            message: "Mail merge failed.",
          },
        });
      })
      .finally(() => {
        this.setState({ loaded: true });
      });
  };

  onSelectedDraftChange = (selectedId: string) => {
    this.setState({
      mergeConfig: {
        ...this.state.mergeConfig,
        draftId: selectedId,
      },
    });
    this.refreshMergeHints();
  };

  render() {
    return (
      <div style={{ width: "97%" }}>
        {this.state.snackbar && (
          <Alert
            variant={this.state.snackbar.variant}
            onClose={() => this.setState({ snackbar: undefined })}
            dismissible
          >
            {this.state.snackbar.message}
          </Alert>
        )}
        <Form>
          <Form.Group>
            <Form.Label>Sender Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Sender Name"
              disabled={!this.state.loaded}
              value={this.state.mergeConfig?.senderName ?? ""}
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
          <Form.Group className="mt-2">
            <Form.Label>Email Template</Form.Label>
            <Row>
              <Col xs={11}>
                <Form.Control
                  as="select"
                  disabled={!this.state.loaded}
                  value={
                    this.state.drafts != undefined
                      ? this.state.mergeConfig.draftId
                      : ""
                  }
                  onChange={(e) => this.onSelectedDraftChange(e.target.value)}
                >
                  {this.state.drafts?.map((draft) => {
                    // Show the date in format "Apr. 6, 2020 12:00 AM"
                    const draftDateString = new Date(
                      draft.dateCreated
                    ).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                      hour12: true,
                    });
                    return (
                      <option value={draft.id}>
                        {draft.subject} ({draftDateString})
                      </option>
                    );
                  })}
                  {this.state.drafts === undefined && (
                    <option value="">Loading...</option>
                  )}
                </Form.Control>
              </Col>
              <Col xs={1} className="d-flex justify-content-end">
                <Button
                  variant="outline-primary"
                  disabled={!this.state.loaded}
                  onClick={this.refreshDrafts}
                >
                  <ArrowClockwise />
                </Button>
              </Col>
            </Row>
          </Form.Group>
        </Form>
        <Row>
          <Col
            xs={4}
            className="d-flex justify-content-end align-items-end pr-0"
          >
            {!this.state.loaded && (
              <Spinner animation="border" className="mb-2" size="sm" />
            )}
          </Col>
          <Col xs={8} className="ml-auto">
            <ButtonGroup className="action-panel mt-3">
              <Button
                variant="outline-primary"
                className="mr-2"
                disabled={!this.state.loaded}
                onClick={this.onSendTestEmailClick}
              >
                Send Test Email
              </Button>
              <Button
                variant="primary"
                disabled={!this.state.loaded}
                onClick={this.onRunMailMergeClick}
              >
                {this.state.mergeHints
                  ? `Send ${this.state.mergeHints.numEmailsToBeSent} Email` +
                    (this.state.mergeHints.numEmailsToBeSent > 1 ? "s" : "")
                  : "Send All Emails"}
              </Button>
            </ButtonGroup>
          </Col>
        </Row>
        {this.state.mergeHints && (
          <div className="text-muted small text-right mt-2">
            <p className="mb-0">
              Emails will be sent to recipients in the{" "}
              <b>{this.state.mergeHints.emailColumn}</b> column.
            </p>
            <p>
              Current quota: {this.state.mergeHints.remainingRecipients}{" "}
              recipients remaining
            </p>
          </div>
        )}
      </div>
    );
  }
}

export default MergeWizard;
