<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']))
{
	$ver = $_POST['distributor_id'];
	$select_party=mysqli_query($con,"select * from tbl_party where distributor_id='$ver' and status!='Deleted'");
	if(mysqli_num_rows($select_party)>0)
	{     
		$product=array();
		while($fetch_user=mysqli_fetch_assoc($select_party))
		{
			$product['party_id']=$fetch_user['party_id'];
			$product['party_name']=$fetch_user['party_name'];
			$product['party_phone']=$fetch_user['party_phone'];
			$product['party_email']=$fetch_user['party_email'];
			$product['party_address']=$fetch_user['party_address']; 
			$product['party_ship_address']=$fetch_user['party_ship_address'];
			$product['place_of_supply']=$fetch_user['place_of_supply']; 
			$product['beat_detail']=$fetch_user['beat_detail']; 
			$product['party_code']=$fetch_user['party_code'];
			$product['gstin_no']=$fetch_user['gstin_no'];
			$product['pan_it_no']=$fetch_user['pan_it_no'];
			$product['DLN_no']=$fetch_user['DLN_no'];
			$product['party_type']=$fetch_user['party_type'];
			
			$product['party_name_hindi']=$fetch_user['party_name_hindi'];
			$product['address_hindi']=$fetch_user['address_hindi'];
			$product['ship_address_hindi']=$fetch_user['ship_address_hindi'];
			$product['outstanding_amount']=$fetch_user['outstanding_amount'];
			$product['adjusted_outstanding_amt']=$fetch_user['adjusted_outstanding_amt'];
			
			$pro_party_id=$fetch_user['party_id'];
			$select_user=mysqli_query($con,"select * from tbl_party_user where party_id='$pro_party_id' limit 1");
			while($fetch_party_user=mysqli_fetch_assoc($select_user))
			{
				$product['user_id']=$fetch_party_user['user_id'];
			}
			$response['party_detail'][]=$product;
		}
		$response['success']='1';
	    $response['details']="Fetch Detail Successful";
	}
	else
	{
	  $response['success']='0';
	  $response['details']="Party Doesn't Exist!";	
	}
}
else 
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>