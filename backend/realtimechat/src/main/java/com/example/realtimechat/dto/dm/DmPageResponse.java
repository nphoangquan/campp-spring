package com.example.realtimechat.dto.dm;

import java.util.List;

public class DmPageResponse {
    private List<DmResponse> items;
    private int page;
    private int size;
    private long totalItems;
    private int totalPages;

    public DmPageResponse() {
    }

    public List<DmResponse> getItems() {
        return items;
    }

    public void setItems(List<DmResponse> items) {
        this.items = items;
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }

    public long getTotalItems() {
        return totalItems;
    }

    public void setTotalItems(long totalItems) {
        this.totalItems = totalItems;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public void setTotalPages(int totalPages) {
        this.totalPages = totalPages;
    }
}
