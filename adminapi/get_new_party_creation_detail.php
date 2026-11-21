<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']))
{  
	$ver = $_POST['distributor_id'];
	$milkman_type='No';
	$res_distributor = mysqli_query($con,"select distributor_id from tbl_distributor where distributor_id='$ver' and milkman_type='Yes'");
	if(mysqli_num_rows($res_distributor)>0)
		$milkman_type='Yes';
	
	if($milkman_type=='No')
	{
		$select_user=mysqli_query($con,"select tbl_party.party_id,tbl_party.party_name,tbl_party.party_phone,tbl_user.user_id,tbl_user.user_name from tbl_party,tbl_party_user,tbl_user where tbl_party_user.party_id=tbl_party.party_id and tbl_party_user.user_id=tbl_user.user_id and tbl_party.distributor_id='$ver' and tbl_party.status='Creation'");
		if(mysqli_num_rows($select_user)>0)
		{     
			$product=array();
			while($fetch_user=mysqli_fetch_array($select_user))
			{
				$product['party_id']=$fetch_user['party_id'];
				$product['party_name']=$fetch_user['party_name'];
				$product['phone_no']=$fetch_user['party_phone'];
				$product['user_id']=$fetch_user['user_id'];
				$product['user_name']=$fetch_user['user_name'];
				$response['parties'][]=$product;
			}
			$response['success']='1';
			$response['details']="Fetch Detail Successful";	
		}
		else
		{
			$response['success']='0';
			$response['details']="No data Available";	
		}
	}
	else
	{
		$select_user=mysqli_query($con,"select * from tbl_party_creation,tbl_user where tbl_party_creation.user_id=tbl_user.user_id and tbl_party_creation.distributor_id='$ver' and tbl_user.status in ('Active','Deactive') and tbl_party_creation.status='Pending'");
		if(mysqli_num_rows($select_user)>0)
		{     
			$product=array();
			while($fetch_user=mysqli_fetch_array($select_user))
			{
				$product['party_id']=$fetch_user['party_creation_id'];
				$product['party_name']=$fetch_user['party_name'];
				$product['phone_no']=$fetch_user['party_phone'];
				$product['user_id']=$fetch_user['user_id'];
				$product['user_name']=$fetch_user['user_name'];
				$product['remark']=$fetch_user['remark'];
				$product['next_followup_date']=$fetch_user['next_followup_date'];
				$product['latitude']=$fetch_user['latitude'];
				$product['longitude']=$fetch_user['longitude'];
				$product['location_image']="retailer_location_image/".$fetch_user['location_image'];
				$response['parties'][]=$product;
			}
			$response['success']='1';
			$response['details']="Fetch Detail Successful";	
		}
		else
		{
			$response['success']='0';
			$response['details']="No data Available";	
		}
	}
	
}
else
{
	$response['success']=0;
	$response['details']="Required Field Missing...!!";	
}
echo json_encode($response);

?>