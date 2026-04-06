import hashlib

def get_company_logo_data(company_name: str):
    """
    Returns consistent branding data (monogram, color, logo) for a given company.
    """
    # 1. Monogram Logic
    monogram = "".join([w[0] for w in company_name.split()[:2]]).upper()
    
    # 2. Consistent Color Logic
    color_hex = "#" + hashlib.md5(company_name.encode()).hexdigest()[:6]
    
    # 3. Logo Mapping (Clearbit)
    domain_map = {
        "Google": "google.com",
        "Amazon": "amazon.com",
        "Microsoft": "microsoft.com",
        "Adobe": "adobe.com",
        "Meta": "meta.com",
        "Netflix": "netflix.com",
        "Flipkart": "flipkart.com",
        "Accenture": "accenture.com",
        "Wipro": "wipro.com",
        "Zoho": "zoho.com",
        "Swiggy": "swiggy.in",
        "Zomato": "zomato.com",
        "Capgemini": "capgemini.com"
    }
    
    domain = domain_map.get(company_name, company_name.lower().replace(" ", "") + ".com")
    logo = f"https://www.google.com/s2/favicons?domain={domain}&sz=128" if company_name != "General HR" else None
    
    return {
        "monogram": monogram,
        "color": color_hex,
        "logo": logo
    }
