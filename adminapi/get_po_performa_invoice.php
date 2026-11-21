<?php
include("../../connect.php");
$response = array();
if(isset($_POST['distributor_id']) )
{
	$session_dist_ver = $_POST['distributor_id'];
	$cparty=$_POST['searchparty'];
	$cbillno=$_POST['sbillno'];
	
	$response['tcs_tds_percentage']=0;
	$select_tcstds = mysqli_query($con,"select * from tbl_bthawk_tcs_tds_details");
	if(mysqli_num_rows($select_tcstds)>0)
	{
		$fetch_tcstds=mysqli_fetch_array($select_tcstds);
		$response['tcs_tds_percentage']=$fetch_tcstds['value'];
	}

    $queryres = "SELECT *,tbl_party_transaction_performa.status as perstatus FROM tbl_party_transaction_performa,tbl_party WHERE tbl_party_transaction_performa.transaction_to= tbl_party.party_id AND tbl_party.distributor_id='$session_dist_ver' and tbl_party_transaction_performa.status!='Deleted'";
    if($cbillno!="")
    {
		$queryres=$queryres." "."AND tbl_party_transaction_performa.doc_number LIKE '".$cbillno."%'";
    }
    if($cparty!="")
    {
		$queryres=$queryres." "."AND tbl_party.party_id ='$cparty'";
    }
    $queryres=$queryres." "."ORDER BY tbl_party_transaction_performa.transaction_id DESC";
    $res = mysqli_query($con,$queryres);
	
	$bill_detail=array();
	if(mysqli_num_rows($res)>0)
	{     
		while($fetch_product=mysqli_fetch_assoc($res))
		{
			extract($fetch_product);
			
			$res_users = mysqli_query($con,"select user_id from tbl_user where distributor_id='$session_dist_ver' and status='Active'");
			$fetch_user=mysqli_fetch_assoc($res_users);
			
			$bill_detail['transaction_id']=$transaction_id; 
			$bill_detail['invoice_type']=$invoice_type;
			$bill_detail['doc_number']=$doc_number;
			$bill_detail['drawing_no']=$drawing_no;
			$bill_detail['fse_id']=$fetch_user['user_id'];
			$bill_detail['party_id']=$transaction_to;
			$bill_detail['party_name']=$party_name;
			$bill_detail['party_phone']=$party_phone;
			$bill_detail['gstin_no']=$gstin_no;
			$bill_detail['transaction_date']=$transaction_date;
			$bill_detail['status']=$perstatus; 
			$bill_detail['transaction_time'] = $transaction_time;
			$bill_detail['total_amount'] = $fetch_product['total_amount'];
			$bill_detail['product_type']=$fetch_product['unique_bill_type'];
			$bill_detail['gst_applicable']=$fetch_product['gst_applicable'];
			$bill_detail['bill_type']=$fetch_product['bill_type'];
			$bill_detail['remark']=$fetch_product['remark'];
			
			$bill_detail['itemdetail']=array();
			$transaction_id=$fetch_product['transaction_id'];
			$res1 = mysqli_query($con,"select *,tbl_party_transaction_detail_performa.product_price as saleprice from tbl_party_transaction_detail_performa,tbl_product where tbl_party_transaction_detail_performa.product_id=tbl_product.product_id and tbl_party_transaction_detail_performa.transaction_id='$transaction_id'");
			if(mysqli_num_rows($res1)>0) 
			{
				while($fetch_product3=mysqli_fetch_assoc($res1))
				{
					$itemdetail['product_id']=$fetch_product3['product_id'];
					$itemdetail['product_name']=$fetch_product3['product_name'];
					$itemdetail['product_type']=$fetch_product3['product_type'];
					$itemdetail['hsn_code']=$fetch_product3['hsn_code'];
					$itemdetail['price']=$fetch_product3['saleprice'];
					$itemdetail['quantity']=$fetch_product3['quantity'];
					$itemdetail['gst_rate']=$fetch_product3['gst_rate'];
					$itemdetail['cgst_amt']=$fetch_product3['cgst_amt'];
					$itemdetail['sgat_amt']=$fetch_product3['sgat_amt'];
					$itemdetail['igst_amt']=$fetch_product3['igst_amt'];
					$itemdetail['cess_amt']=$fetch_product3['cess_amt'];
					$itemdetail['pro_total_amt']=$fetch_product3['pro_total_amt'];
					$itemdetail['cess_applicable']=$fetch_product3['cess_applicable'];
					$itemdetail['cess_percentage']=$fetch_product3['cess_percentage'];
					$itemdetail['unit']=$fetch_product3['unit'];
					$itemdetail['maintain_inventory']=$fetch_product3['maintain_inventory'];
					$itemdetail['tcs_tds_applicable']=$fetch_product3['tcs_tds_applicable'];
					$bill_detail['itemdetail'][]=$itemdetail;
				}
			}
			
			$bill_detail['invoice_pdf'] ="performa-product-detail-pdf.php?id=".$transaction_id."&user_id=".$session_dist_ver;
			
			
			$response['bill_detail'][]=$bill_detail;
		}
	}
	else
	{
		$response['bill_detail']=$bill_detail;
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