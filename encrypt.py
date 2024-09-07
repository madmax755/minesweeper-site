import base64
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import padding

def encrypt_content(content, key):
    # Convert the key to bytes and pad it to 32 bytes
    key = key.encode('utf-8')
    key = key.ljust(32, b'\0')  # Pad with null bytes
    
    # Convert the content to bytes
    content = content.encode('utf-8')
    
    # Pad the content
    padder = padding.PKCS7(128).padder()
    padded_content = padder.update(content) + padder.finalize()
    
    # Create a new AES cipher
    cipher = Cipher(algorithms.AES(key), modes.ECB(), backend=default_backend())
    encryptor = cipher.encryptor()
    
    # Encrypt the content
    encrypted_content = encryptor.update(padded_content) + encryptor.finalize()
    
    # Encode the encrypted content to base64
    encoded_content = base64.b64encode(encrypted_content).decode('utf-8')
    
    return encoded_content

# Example usage
secret_message = """Hi Bootiest! 

I love you so so so so much (more than you do). Please never doubt that x

Love, Your 2nd Bootiest."""
encryption_key = "mo"

encrypted = encrypt_content(secret_message, encryption_key)
print(f"Encrypted content: {encrypted}")