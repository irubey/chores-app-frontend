import React, { useState } from "react";
import Modal from "@/components/common/Modal";
import Input from "@/components/common/Input";
import { useHousehold } from "@/hooks/useHousehold";
import { CreateThreadDTO } from "@shared/types";
import { useThreads } from "@/hooks/useThreads";
import { HouseholdMemberWithUser } from "@shared/types";

const NewThreadModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    []
  );
  const [message, setMessage] = useState("");
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string>("");

  const { selectedHouseholds, members } = useHousehold();
  const { startNewThread, threadStatus } = useThreads();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHouseholdId) return;

    const threadData: CreateThreadDTO = {
      householdId: selectedHouseholdId,
      title: title.trim(),
      participants: selectedParticipants,
      initialMessage: message.trim()
        ? {
            threadId: "",
            content: message.trim(),
          }
        : undefined,
    };

    try {
      await startNewThread(selectedHouseholdId, threadData);
      setIsOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to create thread:", error);
    }
  };

  const resetForm = () => {
    setTitle("");
    setSelectedParticipants([]);
    setMessage("");
    setSelectedHouseholdId("");
  };

  // Get members for the selected household
  const householdMembers = members.filter(
    (member): member is HouseholdMemberWithUser =>
      member.householdId === selectedHouseholdId && "user" in member
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn-primary text-sm"
        disabled={selectedHouseholds.length === 0}
      >
        New Thread
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          resetForm();
        }}
        title="Create New Thread"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Household Selection */}
          <div>
            <label htmlFor="household" className="form-label">
              Select Household
            </label>
            <select
              id="household"
              value={selectedHouseholdId}
              onChange={(e) => setSelectedHouseholdId(e.target.value)}
              className="input"
              required
            >
              <option value="">Choose a household</option>
              {selectedHouseholds.map((household) => (
                <option key={household.id} value={household.id}>
                  {household.name}
                </option>
              ))}
            </select>
          </div>

          {selectedHouseholdId && (
            <>
              {/* Thread Title */}
              <div>
                <label htmlFor="title" className="form-label">
                  Thread Title (Optional)
                </label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter thread title"
                  maxLength={100}
                />
              </div>

              {/* Participant Selection */}
              <div>
                <label className="form-label">Participants</label>
                <div className="max-h-40 overflow-y-auto border border-neutral-200 dark:border-neutral-700 rounded-md divide-y divide-neutral-200 dark:divide-neutral-700">
                  {householdMembers.map((member) => (
                    <label
                      key={member.id}
                      className="flex items-center p-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedParticipants.includes(member.userId)}
                        onChange={(e) => {
                          setSelectedParticipants(
                            e.target.checked
                              ? [...selectedParticipants, member.userId]
                              : selectedParticipants.filter(
                                  (id) => id !== member.userId
                                )
                          );
                        }}
                        className="w-4 h-4 rounded border-neutral-300 text-primary focus:ring-primary"
                      />
                      <span className="ml-2 text-sm">{member.user.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Initial Message */}
              <div>
                <label htmlFor="message" className="form-label">
                  Initial Message (Optional)
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your first message..."
                  className="input min-h-[100px]"
                />
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                resetForm();
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={
                !selectedHouseholdId ||
                selectedParticipants.length === 0 ||
                threadStatus.create === "loading"
              }
            >
              {threadStatus.create === "loading" ? (
                <span className="flex items-center">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Creating...
                </span>
              ) : (
                "Create Thread"
              )}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default NewThreadModal;
