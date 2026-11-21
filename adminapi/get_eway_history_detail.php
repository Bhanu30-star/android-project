<?php
include("../../connect.php");
$response = array();
if(isset($_POST['cdate1']) && isset($_POST['cdate2']) &&  isset($_POST['distributor_id']))
{
	$cdate1=$_POST['cdate1'];
	$cdate2=$_POST['cdate2'];
	$session_dist_ver = $_POST['distributor_id'];
	$cparty=$_POST['searchparty'];
	$billno=$_POST['billno'];
	$sdoc_type=$_POST['doc_type'];
	$res = "select *  from tbl_party_eway where document_date>='$cdate1' and document_date<='$cdate2' and distributor_id='$session_dist_ver' and status in ('Pending','Complete')";
	if($cparty!="")
		$res=$res." "."and (buyer_legalname like '%$cparty%' or buyer_phone='$cparty')";
	if($billno!="")
		$res=$res." "."and document_no='$billno'";
	if($sdoc_type!="")
		$res=$res." "."and document_type='$sdoc_type'";
	$res=$res." "."order by document_no ASC";
	$query1=mysqli_query($con,$res);
	$billbook=array();
	if(mysqli_num_rows($query1)>0)
	{     
		while($fetch_product2=mysqli_fetch_assoc($query1))
		{
			$billbook['transaction_id']=$fetch_product2['transaction_id'];
			$billbook['document_type']=$fetch_product2['document_type'];
			$billbook['document_no']=$fetch_product2['document_no'];
			$billbook['document_date']=$fetch_product2['document_date'];
			$billbook['buyer_detail']=$fetch_product2['buyer_trade'].' - '.$fetch_product2['buyer_phone'];
			$billbook['doc_item_amount']=$fetch_product2['total_inv_vaue'];
			$billbook['doc_other_charges']=$fetch_product2['doc_other_charges'];
			$billbook['status']=$fetch_product2['status'];
			$billbook['ewayBillNo']=$fetch_product2['ewayBillNo'];
			$billbook['ewayBillDate']=$fetch_product2['ewayBillDate'];
			$billbook['validUpto']=$fetch_product2['validUpto'];
			$billbook['json_data']=$fetch_product2['json_data'];
			$billbook['eway_url']='';
			if($fetch_product2['ewayBillNo']!='') { 
				$billbook['eway_url']="https://bthawk.appexperts.net/download-eway-billpdf.php?transaction_id=".base64_encode($fetch_product2['transaction_id'])."&dist_id=".base64_encode($session_dist_ver);
			}
			$response['billbook'][]=$billbook;
		}
		$response['success']='1';
		$response['details']="Fetch Detail Successful";
	}
	else
	{
		$response['billbook']=$billbook;
		$response['success']='0';
		$response['details']="No data Available";
	}
	
}		
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>