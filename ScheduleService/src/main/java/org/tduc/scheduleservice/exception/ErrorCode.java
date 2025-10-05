package org.tduc.scheduleservice.exception;

public enum ErrorCode {
    USER_EXISTED(1001, "USER EXISTED"),
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized"),
    INVALID_ARGUMENTS(99999, "Invalid Arguments"),
    USER_MIN(366, "Username must be longer or equal 3"),
    PASSWORD_MAX(633, "Password must be shorter or equal 8"),
    USER_NOT_FOUND(444, "User Not Found"),
    USERNAME_NOT_EXIST(36, "Username not found"),
    UNAUTHENTICATED(4444, "UNAUTHENTICATED"),
    SCHEDULE_NOT_FOUND(555, "Schedule not found"), COURSE_NOT_FOUND(3636,"Course not found" ), USER_ALREADY_JOINED(4444,"this user is already joined" );


    private final int code;
    private final String message;

    ErrorCode(int code, String message) {
        this.code = code;
        this.message = message;
    }

    public int getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }
}
