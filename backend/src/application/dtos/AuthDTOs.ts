export interface RegistrationRequestDTO {
    email: string;
    password: string;
    fullName: string;
}

export interface LoginRequestDTO {
    email: string;
    password: string;
}

export interface AuthResponseDTO {
    user: {
        id: string;
        email: string;
        fullName: string;
        role: string;
        isApproved: boolean;
    };
}

export interface TokensDTO {
    accessToken: string;
    refreshToken: string;
}