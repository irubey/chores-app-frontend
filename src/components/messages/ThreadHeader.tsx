//Purpose:Displays thread-specific information such as title, participants, and available actions (e.g., settings).

import React, { useState } from "react";
import {
  ThreadWithParticipants,
  HouseholdMemberWithUser,
  HouseholdMember,
  Household,
} from "@shared/types";
import { useThreads } from "@/hooks/useThreads";
import { useHousehold } from "@/hooks/useHousehold";
import {
  EllipsisHorizontalIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import Modal from "@/components/common/Modal";

interface ThreadHeaderProps {
  thread: ThreadWithParticipants;
}

const ThreadHeader: React.FC<ThreadHeaderProps> = ({ thread }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [newParticipants, setNewParticipants] = useState<string[]>([]);

  const { threadStatus } = useThreads();
  const participants = thread.participants;

  // Type guard function to check if a participant has user details
  const hasUserDetails = (
    participant: HouseholdMemberWithUser | HouseholdMember
  ): participant is HouseholdMemberWithUser => {
    return (
      "user" in participant &&
      participant.user !== undefined &&
      "name" in participant.user
    );
  };

  return (
    <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-background-dark">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-h5 mb-1">{thread.title || "Untitled Thread"}</h2>
          <p className="text-sm text-text-secondary">
            {thread.householdId} • {thread.participants.length} participants
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsInviteOpen(true)}
            className="btn-icon"
            aria-label="Add participants"
          >
            <UserPlusIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="btn-icon"
            aria-label="Thread settings"
          >
            <EllipsisHorizontalIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Invite Modal */}
      <Modal
        isOpen={isInviteOpen}
        onClose={() => {
          setIsInviteOpen(false);
          setNewParticipants([]);
        }}
        title="Add Participants"
      >
        <div className="space-y-4">
          <div className="max-h-60 overflow-y-auto border border-neutral-200 dark:border-neutral-700 rounded-md divide-y divide-neutral-200 dark:divide-neutral-700">
            {availableMembers.map((member) => (
              <label
                key={member.id}
                className="flex items-center p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={newParticipants.includes(member.userId)}
                  onChange={(e) => {
                    setNewParticipants(
                      e.target.checked
                        ? [...newParticipants, member.userId]
                        : newParticipants.filter((id) => id !== member.userId)
                    );
                  }}
                  className="w-4 h-4 rounded border-neutral-300 text-primary focus:ring-primary"
                />
                <span className="ml-3 text-sm">{member.user?.name}</span>
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setIsInviteOpen(false);
                setNewParticipants([]);
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleInviteUsers}
              className="btn-primary"
              disabled={
                !newParticipants.length || threadStatus.invite === "loading"
              }
            >
              {threadStatus.invite === "loading" ? (
                <span className="flex items-center">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Adding...
                </span>
              ) : (
                "Add Participants"
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Thread Settings"
      >
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Current Participants</h4>
            <div className="space-y-2">
              {participantsWithDetails.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between py-2"
                >
                  <span className="text-sm">
                    {hasUserDetails(participant)
                      ? participant.user.name
                      : "Unknown User"}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {participant.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="btn-secondary w-full"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ThreadHeader;
