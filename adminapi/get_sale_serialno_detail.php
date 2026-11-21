<?php
include("../../connect.php");
$response = array();
if(isset($_POST['distributor_id']))
{
	$session_dist_ver = $_POST['distributor_id'];
	$cdate1=isset($_POST['searchdate1']) ? $_POST['searchdate1'] : '';
	$cdate2=isset($_POST['searchdate2']) ? $_POST['searchdate2'] : '';
	$searchimei=isset($_POST['searchimei']) ? $_POST['searchimei'] : '';
	if($searchimei!='')
	{
		$res = mysqli_query($con,"SELECT * FROM `tbl_party_transaction`,tbl_party_transaction_detail,tbl_party where tbl_party_transaction.transaction_id=tbl_party_transaction_detail.transaction_id and tbl_party_transaction.transaction_to = tbl_party.party_id and tbl_party.distributor_id = '$session_dist_ver' and tbl_party_transaction_detail.IMEI_NO='$searchimei' and tbl_party_transaction_detail.product_id in (select product_id from tbl_product where product_type='Serial No' and distributor_id='$session_dist_ver')");
	}
	else
	{
		$res = mysqli_query($con,"SELECT * FROM `tbl_party_transaction`,tbl_party_transaction_detail,tbl_party where tbl_party_transaction.transaction_id = tbl_party_transaction_detail.transaction_id and tbl_party_transaction.transaction_to = tbl_party.party_id and tbl_party_transaction.transaction_date>='$cdate1' and tbl_party_transaction.transaction_date<='$cdate2' and tbl_party.distributor_id = '$session_dist_ver' and tbl_party_transaction_detail.product_id in (select product_id from tbl_product where product_type='Serial No' and distributor_id='$session_dist_ver')");
	}
	$billbook=array();
	if(mysqli_num_rows($res)>0)
	{     
		while($fetch_product2=mysqli_fetch_assoc($res))
		{
			$res_detail = mysqli_query($con,"SELECT * FROM tbl_product where distributor_id = '$session_dist_ver' and product_id='".$fetch_product2['product_id']."'");
			$fetch_data=mysqli_fetch_assoc($res_detail);
			$billbook['transaction_id']=$fetch_product2['transaction_id'];
			$billbook['invoice_number']=$fetch_product2['transaction_bill_number'];
			$billbook['transaction_date']=$fetch_product2['transaction_date'];
			$billbook['transaction_time']=$fetch_product2['transaction_time'];
			$billbook['party_name']=$fetch_product2['party_name'];
			$billbook['party_phone']=$fetch_product2['party_phone'];
			$billbook['product_name']=$fetch_data['product_name'];
			$billbook['product_type']=$fetch_data['serial_type'];
			$billbook['quantity']=$fetch_product2['quantity'];
			$billbook['IMEI_NO']=$fetch_product2['IMEI_NO'];
			$response['billbook'][]=$billbook;
		}
	}
	else
	{		
		$response['billbook']=$billbook;
	}
	$response['success']='1';
	$response['details']="Fetch Detail Successful";
}		
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>