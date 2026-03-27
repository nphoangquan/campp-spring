package com.example.realtimechat.dto.dm;

public class BlockStatusDto {
    private boolean blocked;
    private boolean isBlocker;
    private String blockerUsername;

    public BlockStatusDto(boolean blocked, boolean isBlocker, String blockerUsername) {
        this.blocked = blocked;
        this.isBlocker = isBlocker;
        this.blockerUsername = blockerUsername;
    }

    public boolean isBlocked() { return blocked; }
    public void setBlocked(boolean blocked) { this.blocked = blocked; }

    public boolean isBlocker() { return isBlocker; }
    public void setBlocker(boolean isBlocker) { this.isBlocker = isBlocker; }

    public String getBlockerUsername() { return blockerUsername; }
    public void setBlockerUsername(String blockerUsername) { this.blockerUsername = blockerUsername; }
}
